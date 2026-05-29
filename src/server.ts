import "./lib/error-capture";

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type RuntimeEnv = Record<string, string | undefined>;

type PixPaymentRequest = {
  description?: string;
  payerEmail?: string;
  payerFirstName?: string;
  payerLastName?: string;
  quantity?: number;
};

const MERCADO_PAGO_PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";
const PIX_PAYMENT_AMOUNT = 1;
const DEFAULT_PAYER_EMAIL = "comprador@goleada.com.br";
const DEFAULT_PAYER_FIRST_NAME = "Cliente";
const DEFAULT_PAYER_LAST_NAME = "Goleada";
const ORDERS_TABLE = "pedidos";
const SUPPORTED_PAYMENT_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
  "in_process",
]);

function getRuntimeEnv(env: unknown): RuntimeEnv {
  const processEnv =
    typeof process !== "undefined" && process.env ? (process.env as RuntimeEnv) : {};
  return {
    ...processEnv,
    ...(env && typeof env === "object" ? (env as RuntimeEnv) : {}),
  };
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Erro inesperado.";
}

function getMercadoPagoErrorSummary(data: unknown) {
  if (!data || typeof data !== "object") return undefined;

  const errorData = data as {
    message?: unknown;
    error?: unknown;
    cause?: unknown;
  };

  return {
    message: typeof errorData.message === "string" ? errorData.message : undefined,
    error: typeof errorData.error === "string" ? errorData.error : undefined,
    cause: errorData.cause,
  };
}

function createSupabaseServerClient(runtimeEnv: RuntimeEnv) {
  const supabaseUrl = runtimeEnv.SUPABASE_URL;
  const serviceRoleKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(`Variavel(is) do Supabase ausente(s): ${missing.join(", ")}.`);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizePixPaymentRequest(
  data: PixPaymentRequest,
  runtimeEnv: RuntimeEnv,
  request: Request,
) {
  const quantity = Number(data.quantity ?? 1);
  const now = Date.now();
  const requestUrl = new URL(request.url);
  const isLocalRequest = ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname);
  const testPayerEmail = runtimeEnv.MERCADOPAGO_TEST_PAYER_EMAIL?.trim();
  const payerEmail =
    (isLocalRequest && testPayerEmail ? testPayerEmail : undefined) ||
    data.payerEmail?.trim() ||
    DEFAULT_PAYER_EMAIL;
  const payerFirstName = data.payerFirstName?.trim() || DEFAULT_PAYER_FIRST_NAME;
  const payerLastName = data.payerLastName?.trim() || DEFAULT_PAYER_LAST_NAME;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    throw new Error("E-mail do comprador invalido.");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantidade invalida.");
  }

  return {
    transaction_amount: PIX_PAYMENT_AMOUNT,
    description: data.description?.trim() || "Copo Goleada Premium 600ml",
    payment_method_id: "pix",
    payer: {
      email: payerEmail,
      first_name: payerFirstName,
      last_name: payerLastName,
    },
    external_reference: `goleada-${quantity}-${now}`,
  };
}

function normalizePaymentStatus(status: unknown) {
  if (typeof status === "string" && SUPPORTED_PAYMENT_STATUSES.has(status)) {
    return status;
  }

  return "pending";
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getMercadoPagoNotificationUrl(request: Request, runtimeEnv: RuntimeEnv) {
  const explicitWebhookUrl = runtimeEnv.MERCADOPAGO_WEBHOOK_URL?.trim();
  if (explicitWebhookUrl) return explicitWebhookUrl;

  const origin = getRequestOrigin(request);
  if (origin.startsWith("https://")) {
    return `${origin}/mercadopago/webhook`;
  }

  return undefined;
}

async function createPixPayment(request: Request, env: unknown) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, { status: 405 });
  }

  const runtimeEnv = getRuntimeEnv(env);
  const accessToken = runtimeEnv.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN nao configurado." }, { status: 500 });
  }

  const input = await readJsonBody<PixPaymentRequest>(request);
  let paymentPayload: ReturnType<typeof normalizePixPaymentRequest>;

  try {
    paymentPayload = normalizePixPaymentRequest(input, runtimeEnv, request);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Dados invalidos." },
      { status: 400 },
    );
  }

  const notificationUrl = getMercadoPagoNotificationUrl(request, runtimeEnv);
  const mercadoPagoPayload = {
    ...paymentPayload,
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  const mercadoPagoResponse = await fetch(MERCADO_PAGO_PAYMENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(mercadoPagoPayload),
  });

  const mercadoPagoData = await mercadoPagoResponse.json().catch(() => ({}));

  if (!mercadoPagoResponse.ok) {
    console.error("[MercadoPago] create_pix_failed", {
      status: mercadoPagoResponse.status,
      response: mercadoPagoData,
    });

    return jsonResponse(
      {
        error: "Nao foi possivel criar o pagamento Pix.",
        mercado_pago: getMercadoPagoErrorSummary(mercadoPagoData),
      },
      { status: mercadoPagoResponse.status },
    );
  }

  const transactionData = mercadoPagoData?.point_of_interaction?.transaction_data ?? {};
  const paymentId = String(mercadoPagoData.id);
  let orderError: unknown;

  try {
    const supabase = createSupabaseServerClient(runtimeEnv);
    const result = await supabase.from(ORDERS_TABLE).insert({
      payment_id: paymentId,
      customer_name: `${paymentPayload.payer.first_name} ${paymentPayload.payer.last_name}`.trim(),
      customer_email: paymentPayload.payer.email,
      quantity: Number(input.quantity ?? 1),
      amount: paymentPayload.transaction_amount,
      status: "pending",
      payment_method: "pix",
    });
    orderError = result.error;
  } catch (error) {
    orderError = error;
  }

  if (orderError) {
    console.error("[Supabase] order_insert_failed", {
      payment_id: paymentId,
      error: getSafeErrorMessage(orderError),
    });

    return jsonResponse(
      {
        error: "Pix criado, mas nao foi possivel salvar o pedido.",
        payment_id: paymentId,
      },
      { status: 500 },
    );
  }

  console.info("[Orders] pix_order_created", {
    payment_id: paymentId,
    status: "pending",
    amount: paymentPayload.transaction_amount,
    payment_method: "pix",
  });

  return jsonResponse({
    qr_code_base64: transactionData.qr_code_base64,
    qr_code: transactionData.qr_code,
    payment_id: paymentId,
    status: mercadoPagoData.status,
  });
}

function parseMercadoPagoSignature(signature: string | null) {
  if (!signature) return {};
  return signature.split(",").reduce<Record<string, string>>((acc, item) => {
    const [key, value] = item.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = 0;

  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i];
  }

  return diff === 0;
}

function getPayloadPaymentId(payload: Record<string, unknown>) {
  const data = payload.data;
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }

  return undefined;
}

async function verifyMercadoPagoWebhook(request: Request, env: unknown) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, { status: 405 });
  }

  const runtimeEnv = getRuntimeEnv(env);
  const webhookSecret = runtimeEnv.MERCADOPAGO_WEBHOOK_SECRET;
  const accessToken = runtimeEnv.MERCADOPAGO_ACCESS_TOKEN;
  const url = new URL(request.url);
  const payload = await readJsonBody<Record<string, unknown>>(request);
  const dataId =
    url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? getPayloadPaymentId(payload);

  if (!dataId) {
    console.info("[MercadoPago] webhook_ignored_without_payment_id", {
      action: payload.action,
      type: payload.type,
    });

    return jsonResponse({
      received: true,
      ignored: true,
      reason: "payment_id ausente na notificacao.",
    });
  }

  if (webhookSecret) {
    const signatureParts = parseMercadoPagoSignature(request.headers.get("x-signature"));
    const requestId = request.headers.get("x-request-id");
    const timestamp = signatureParts.ts;
    const expectedSignature = signatureParts.v1;

    if (!dataId || !requestId || !timestamp || !expectedSignature) {
      return jsonResponse({ error: "Assinatura incompleta." }, { status: 401 });
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const calculatedSignature = await hmacSha256Hex(webhookSecret, manifest);

    if (!timingSafeEqualHex(calculatedSignature, expectedSignature)) {
      return jsonResponse({ error: "Assinatura invalida." }, { status: 401 });
    }
  }

  if (!accessToken) {
    return jsonResponse({ error: "MERCADOPAGO_ACCESS_TOKEN nao configurado." }, { status: 500 });
  }

  const paymentResponse = await fetch(
    `${MERCADO_PAGO_PAYMENTS_URL}/${encodeURIComponent(dataId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const paymentData = await paymentResponse.json().catch(() => ({}));

  if (!paymentResponse.ok) {
    console.error("[MercadoPago] payment_lookup_failed", {
      payment_id: dataId,
      status: paymentResponse.status,
      response: paymentData,
    });

    return jsonResponse(
      {
        error: "Nao foi possivel consultar o pagamento no Mercado Pago.",
        payment_id: dataId,
      },
      { status: paymentResponse.status },
    );
  }

  const paymentStatus = normalizePaymentStatus(paymentData.status);
  let updatedOrder: unknown = null;
  let updateError: unknown;

  try {
    const supabase = createSupabaseServerClient(runtimeEnv);
    const result = await supabase
      .from(ORDERS_TABLE)
      .update({ status: paymentStatus })
      .eq("payment_id", String(dataId))
      .select("id,payment_id,status")
      .maybeSingle();
    updatedOrder = result.data;
    updateError = result.error;
  } catch (error) {
    updateError = error;
  }

  if (updateError) {
    console.error("[Supabase] order_update_failed", {
      payment_id: dataId,
      status: paymentStatus,
      error: getSafeErrorMessage(updateError),
    });

    return jsonResponse(
      {
        error: "Nao foi possivel atualizar o pedido no Supabase.",
        payment_id: dataId,
        status: paymentStatus,
      },
      { status: 500 },
    );
  }

  console.info("[Orders] webhook_order_status_synced", {
    payment_id: dataId,
    status: paymentStatus,
    order_found: Boolean(updatedOrder),
  });

  return jsonResponse({
    received: true,
    action: payload.action,
    type: payload.type,
    payment_id: dataId,
    payment_status: paymentStatus,
    order: updatedOrder,
  });
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/create-pix-payment") {
        return await createPixPayment(request, env);
      }

      if (url.pathname === "/mercadopago/webhook") {
        return await verifyMercadoPagoWebhook(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
