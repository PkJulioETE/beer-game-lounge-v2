
# Integração Mercado Pago — PIX + Cartão de Crédito

Vou portar a arquitetura que você descreveu para o stack deste projeto (TanStack Start + Cloudflare Workers + Lovable Cloud). A lógica de negócio é a mesma; o que muda é a "casca" técnica.

## Adaptações importantes (Express/Firebase/Socket.io → este stack)

| No outro site | Aqui |
|---|---|
| Express (Node) | **Server Functions** (`createServerFn`) + **Server Routes** do TanStack Start |
| Firebase Firestore | **Lovable Cloud** (Postgres + RLS) |
| Socket.io (WebSockets) | **Supabase Realtime** (broadcast no canal do pedido) + **polling fallback** a cada 5s |
| Nodemailer / Twilio / Google Sheets | Fora do escopo desta versão (você optou só por PIX + Cartão) |
| `.env` local | **Secrets do Lovable Cloud** (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`) + `VITE_MERCADOPAGO_PUBLIC_KEY` |

Por que não Socket.io: Cloudflare Workers não suportam WebSocket servers persistentes do jeito tradicional. **Supabase Realtime** resolve a mesma necessidade ("tela muda instantaneamente quando o webhook confirma") e já vem com Lovable Cloud, sem custo extra.

## Etapa 1 — Habilitar Lovable Cloud e cadastrar secrets

1. Habilitar Lovable Cloud (cria Postgres + Auth + Realtime).
2. Adicionar 3 secrets:
   - `MERCADOPAGO_ACCESS_TOKEN` (chave de produção/teste do backend MP)
   - `MERCADOPAGO_WEBHOOK_SECRET` (assinatura do painel MP → Webhooks)
   - `VITE_MERCADOPAGO_PUBLIC_KEY` (chave pública, usada no frontend para tokenizar cartão)

## Etapa 2 — Banco de dados (4 tabelas + RLS)

```text
customers       id, name, email, whatsapp, created_at
orders          id, customer_id, product_name, amount_cents,
                utm_source, utm_medium, utm_campaign, utm_content, utm_term,
                status (initiated|paid|failed|expired), created_at
payments        id, order_id, mp_payment_id, method (pix|card),
                status (pending|approved|rejected|refunded),
                pix_qr_code, pix_qr_code_base64, installments, raw_response_jsonb
webhook_logs    id, mp_event_id (UNIQUE), payload_jsonb, processed_at
```

RLS: leitura pública negada por padrão. Toda escrita/leitura passa por server functions com `supabaseAdmin` (operações de pagamento são server-side, não do cliente). Polling de status do pedido usa server function pública que devolve só `status` + dados não-sensíveis pelo `order_id`.

## Etapa 3 — Frontend: Modal de checkout

Novo componente `src/components/CheckoutModal.tsx` (usando `Dialog` do shadcn já instalado):

- Passo 1 — Identificação: Nome, E-mail, WhatsApp. Auto-save no `localStorage` (`checkoutFormData`) com `useEffect`, idêntico ao que você descreveu.
- Passo 2 — Método: botões **PIX** ou **Cartão de Crédito**.
- Passo 3a (PIX): mostra QR Code (`<img src="data:image/png;base64,...">`) + botão "Copiar código Pix". Polling de 5s + Realtime listener no canal `order:{id}`.
- Passo 3b (Cartão): renderiza o componente `<CardPayment />` do SDK `@mercadopago/sdk-react` inicializado com `VITE_MERCADOPAGO_PUBLIC_KEY`. Tokenização acontece nos servidores do MP; o token + parcelas + issuer chegam ao backend.
- Passo 4 — Sucesso: tela verde de confirmação com número do pedido.

Captura de UTMs: lê `window.location.search` na abertura do modal e envia junto.

O botão **"Comprar"** do StickyBuyBar e do hero passam a abrir este modal (substitui o `<a href="#comprar">` atual).

## Etapa 4 — Backend: Server Functions (`src/lib/checkout.functions.ts`)

```ts
createCheckout({ customer, method: 'pix' | 'card', cardToken?, installments?, utms })
  → cria customer + order + chama MP → retorna { orderId, pix? , status }

getOrderStatus({ orderId })  // polling fallback público
  → retorna { status, paymentStatus }
```

Implementação usa `mercadopago` SDK no handler (Cloudflare nodejs_compat suporta — confirmo no build).

## Etapa 5 — Server Route: Webhook (`src/routes/api/public/mp-webhook.ts`)

- Valida assinatura HMAC-SHA256 com `crypto.timingSafeEqual` lendo header `x-signature` + `MERCADOPAGO_WEBHOOK_SECRET` (exatamente como você descreveu).
- **Idempotência**: insere `mp_event_id` em `webhook_logs` com UNIQUE constraint. Se conflitar (23505), responde 200 sem reprocessar.
- Busca status real no MP via API (não confia só no payload).
- Atualiza `payments.status` e `orders.status`.
- Quando `approved`, faz `supabase.channel('order:{id}').send({ event: 'payment_approved' })` → o modal recebe em tempo real.

URL para colar no painel MP: `https://project--b405d2de-4d15-422a-91ba-c2a5c8fdc6c7.lovable.app/api/public/mp-webhook` (URL estável, não muda se você renomear o projeto).

## Etapa 6 — Realtime + Polling no frontend

```ts
// dentro do modal, depois de createCheckout
const channel = supabase.channel(`order:${orderId}`)
  .on('broadcast', { event: 'payment_approved' }, () => setStep('success'))
  .subscribe();

// fallback
const id = setInterval(async () => {
  const s = await getOrderStatus({ data: { orderId } });
  if (s.status === 'paid') setStep('success');
}, 5000);
```

## Fora do escopo desta versão (podemos fazer depois)

- E-mail automático pós-venda (Resend via connector)
- WhatsApp Twilio
- Google Sheets sync
- Fila de retry para painel externo

## Pré-requisitos do usuário

1. Conta Mercado Pago com app criado em https://www.mercadopago.com.br/developers/panel/app
2. Pegar **Access Token** (Production ou Test) + **Public Key** + criar **Webhook** com o evento `payment` para obter o **secret**
3. Confirmar habilitar Lovable Cloud (necessário para banco e secrets)

Quando você aprovar o plano, eu peço os 3 secrets via formulário seguro e começo pela tabela + modal + PIX (deixo cartão por último porque depende do SDK React do MP estar funcionando no build).
