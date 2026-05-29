import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import heroGlass from "@/assets/hero-glass.jpg";
import lifestyleFriends from "@/assets/lifestyle-friends.jpg";
import decorBar from "@/assets/decor-bar.jpg";
import giftBox from "@/assets/gift.jpg";
import macroBeer from "@/assets/macro-beer.jpg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import {
  Beer,
  Gift,
  Flame,
  Trophy,
  Check,
  Star,
  ShieldCheck,
  Truck,
  Award,
  Users,
  CreditCard,
  Lock,
  Zap,
  X,
  Heart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Copo Temático de Futebol 600ml — O Copo Oficial da Resenha" },
      {
        name: "description",
        content:
          "Cerveja gelada, jogo na TV e amigos por perto. O copo temático de futebol premium 600ml que transforma cada partida em um ritual.",
      },
      { property: "og:title", content: "Copo Temático de Futebol Premium 600ml" },
      {
        property: "og:description",
        content: "O presente perfeito para o torcedor. Garanta o seu com frete grátis.",
      },
    ],
  }),
  component: Index,
});

type PixPayment = {
  qr_code_base64?: string;
  qr_code?: string;
  payment_id?: number | string;
  status?: string;
};

type Kit = {
  qty: number;
  price: string;
  old: string;
  per: string;
  badge: string | null;
  off: string;
};

const kits: Kit[] = [
  { qty: 1, price: "49,90", old: "89,90", per: "49,90", badge: null, off: "45%" },
  { qty: 2, price: "89,80", old: "179,80", per: "44,90", badge: "Mais vendido", off: "50%" },
  { qty: 4, price: "159,60", old: "359,60", per: "39,90", badge: "Melhor custo", off: "55%" },
];

function Index() {
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  async function handlePixPurchase(kit: Kit = kits[0]) {
    setPaymentLoading(true);
    setPaymentError(null);
    setCopyFeedback(null);
    setPixDialogOpen(true);

    try {
      const response = await fetch("/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: kit.qty,
          description: `Kit Goleada Premium 600ml - ${kit.qty} ${kit.qty > 1 ? "copos" : "copo"}`,
          payerEmail: "comprador@goleada.com.br",
          payerFirstName: "Cliente",
          payerLastName: "Goleada",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Nao foi possivel gerar o Pix.");
      }

      setPixPayment(data);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Erro ao gerar o Pix.");
      setPixPayment(null);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function copyPixCode() {
    if (!pixPayment?.qr_code) return;

    await navigator.clipboard.writeText(pixPayment.qr_code);
    setCopyFeedback("Codigo Pix copiado.");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      {/* TOP URGENCY BAR */}
      <div className="bg-accent text-accent-foreground text-center text-xs sm:text-sm py-2 px-4 font-semibold">
        <Flame className="inline w-4 h-4 mr-1 -mt-0.5" />
        OFERTA RELÂMPAGO · 45% OFF + FRETE GRÁTIS · termina em <CountdownTimer compact />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-2xl tracking-wider">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="text-shine">GOLEADA</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#beneficios" className="hover:text-primary transition">
              Benefícios
            </a>
            <a href="#avaliacoes" className="hover:text-primary transition">
              Avaliações
            </a>
            <a href="#faq" className="hover:text-primary transition">
              Perguntas
            </a>
          </div>
          <a href="#comprar">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Quero o meu
            </Button>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-pitch)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,oklch(0.85_0.18_90)_0%,transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-5 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" /> Edição Premium 600ml
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" /> +2.300 vendidos
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] uppercase">
              O copo oficial <br />
              da <span className="text-shine">resenha</span> <br />
              com os amigos.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Cerveja gelada, jogo na TV, churrasco na brasa. O copo temático de futebol{" "}
              <strong className="text-foreground">600ml premium</strong> que transforma cada partida
              em um ritual de torcedor de verdade.
            </p>

            <div className="flex items-end gap-3">
              <span className="text-muted-foreground line-through text-lg">R$ 89,90</span>
              <span className="font-display text-5xl md:text-6xl text-shine leading-none">
                R$ 49,90
              </span>
              <span className="text-sm text-muted-foreground mb-1">à vista</span>
            </div>
            <p className="text-sm text-muted-foreground -mt-4">
              ou <strong className="text-foreground">3x de R$ 16,63</strong> sem juros no cartão
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Button
                size="lg"
                className="h-16 px-10 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-gold)] uppercase tracking-wider"
                onClick={() => handlePixPurchase(kits[0])}
                disabled={paymentLoading}
              >
                <Beer className="w-5 h-5 mr-2" />{" "}
                {paymentLoading ? "Gerando Pix..." : "Comprar com 45% OFF"}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-muted-foreground">4,9/5 · +2.300 torcedores aprovaram</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4 text-primary flex-shrink-0" /> Frete grátis
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" /> Garantia 30 dias
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4 text-primary flex-shrink-0" /> 3x sem juros
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4 text-primary flex-shrink-0" /> Site seguro
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
            <div className="absolute -top-4 -right-4 z-10 bg-accent text-accent-foreground font-display text-2xl uppercase rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-[var(--shadow-gold)] rotate-12">
              <span className="text-xs leading-none">até</span>
              <span className="leading-none">45%</span>
              <span className="text-xs leading-none">OFF</span>
            </div>
            <img
              src={heroGlass}
              alt="Copo temático de futebol premium 600ml com cerveja gelada"
              width={1280}
              height={1280}
              className="relative animate-float rounded-2xl shadow-[var(--shadow-deep)] object-cover w-full"
            />
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>
                <strong className="text-foreground">37 pessoas</strong> comprando agora
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "+2.300", l: "Clientes felizes" },
            { n: "4,9★", l: "Avaliação média" },
            { n: "98%", l: "Recomendam" },
            { n: "24h", l: "Envio rápido" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl md:text-4xl text-shine">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl uppercase">
              Mais que um copo. <span className="text-shine">Uma experiência.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Feito para quem vive o jogo de verdade. Para quem reúne os amigos, acende a
              churrasqueira e abre uma gelada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Beer,
                title: "600ml de pura gelada",
                desc: "Capacidade generosa pra você curtir o jogo inteiro sem precisar levantar.",
              },
              {
                icon: Flame,
                title: "Clima de estádio em casa",
                desc: "Design temático que coloca você direto na arquibancada do seu time.",
              },
              {
                icon: Gift,
                title: "Presente que emociona",
                desc: "Aniversário, Dia dos Pais, amigo secreto: ninguém esquece esse presente.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-2xl uppercase mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIFESTYLE */}
      <section className="py-24 px-5 bg-card/30">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <img
            src={lifestyleFriends}
            alt="Amigos brindando com copos de cerveja assistindo futebol"
            width={1280}
            height={900}
            loading="lazy"
            className="rounded-2xl shadow-[var(--shadow-deep)] object-cover"
          />
          <div>
            <h2 className="font-display text-4xl md:text-5xl uppercase leading-tight">
              Toda partida vira <span className="text-shine">resenha inesquecível</span>.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg">
              Imagina: amigos chegando, churrasco no ponto, gelo no isopor e na sua mão o copo que
              grita "futebol". É esse o clima que a gente entrega.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Perfeito para cerveja, chopp e drinks",
                "Ideal para área gourmet, bar em casa e man cave",
                "Decoração premium pra mostrar pra galera",
                "Resistente, fácil de lavar, não perde o brilho",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* DUAS IMAGENS */}
      <section className="py-24 px-5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={decorBar}
              alt="Copo temático decorando bar em casa"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <h3 className="font-display text-3xl uppercase">Decoração que impressiona</h3>
              <p className="text-muted-foreground mt-2">
                Estilo premium pra deixar seu bar em casa com cara de profissional.
              </p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden group">
            <img
              src={giftBox}
              alt="Copo de futebol em embalagem presente"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <h3 className="font-display text-3xl uppercase">Presente que marca</h3>
              <p className="text-muted-foreground mt-2">
                Pra pai, marido, namorado ou amigo fã de futebol — chega embalado pra impressionar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MACRO + PARA QUEM */}
      <section className="py-24 px-5 bg-card/30">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl uppercase leading-tight">
              Feito pra quem <span className="text-shine">vive cada lance</span>.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg">
              Esse copo é pra quem entende que cerveja não é só bebida — é tradição. É pra quem
              grita gol, pra quem chora final, pra quem nunca perde um clássico.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {[
                { icon: Users, t: "Pra galera da resenha" },
                { icon: Flame, t: "Pra reis do churrasco" },
                { icon: Heart, t: "Pro fã número 1 do time" },
                { icon: Gift, t: "Presente que arranca sorriso" },
              ].map(({ icon: Icon, t }) => (
                <div
                  key={t}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img
              src={macroBeer}
              alt="Detalhe do copo com cerveja gelada e espuma"
              width={1024}
              height={1024}
              loading="lazy"
              className="relative rounded-2xl shadow-[var(--shadow-deep)] object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center mb-4">
            Por que esse <span className="text-shine">não é qualquer copo</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Comparado aos copos comuns de cerveja, o nosso joga em outra categoria.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border border-border bg-card/50">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Copo comum
              </div>
              <h3 className="font-display text-2xl uppercase mb-6">Sem personalidade</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Genérico, igual a qualquer outro",
                  "Sem clima de jogo",
                  "Não vira papo de mesa",
                  "Presente esquecível",
                  "Vidro fino que quebra fácil",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 to-transparent relative">
              <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Recomendado
              </span>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">
                Goleada Premium 600ml
              </div>
              <h3 className="font-display text-2xl uppercase mb-6">Resenha de outro nível</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Design temático de futebol exclusivo",
                  "Clima de estádio em qualquer lugar",
                  "600ml: gelada que dura o jogo todo",
                  "Presente que ninguém esquece",
                  "Vidro resistente, lavável em máquina",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="avaliacoes" className="py-24 px-5 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center mb-16">
            Quem comprou <span className="text-shine">não largou mais</span>.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Rafael M.",
                role: "São Paulo, SP",
                text: "Comprei pro meu pai no Dia dos Pais. Ele simplesmente parou de usar qualquer outro copo. Virou tradição na casa dele.",
              },
              {
                name: "Camila S.",
                role: "Belo Horizonte, MG",
                text: "Presenteei meu namorado e ele AMOU. Agora todo jogo ele faz questão de tomar a cerveja nesse copo.",
              },
              {
                name: "Diego P.",
                role: "Curitiba, PR",
                text: "Comprei 4 pra usar no churrasco com a galera. A resenha ficou outra coisa. Vale cada centavo.",
              },
            ].map((t) => (
              <div key={t.name} className="p-8 rounded-2xl bg-card border border-border">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6">"{t.text}"</p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA / CTA */}
      <section id="comprar" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" /> Oferta termina em <CountdownTimer compact />
            </span>
            <h2 className="font-display text-4xl md:text-6xl uppercase mt-6 leading-tight">
              Escolha seu kit e <span className="text-shine">economize mais</span>.
            </h2>
            <p className="text-muted-foreground mt-3">
              Quanto maior o kit, maior o desconto. Frete grátis pra todos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {kits.map((k) => {
              const featured = k.badge === "Mais vendido";
              return (
                <div
                  key={k.qty}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    featured
                      ? "border-primary bg-gradient-to-b from-primary/15 to-card scale-[1.02] shadow-[var(--shadow-gold)]"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {k.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                      {k.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-display text-3xl uppercase">
                      {k.qty} {k.qty > 1 ? "Copos" : "Copo"}
                    </div>
                    <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-1 rounded">
                      -{k.off}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-display text-4xl text-shine">R$ {k.price}</span>
                  </div>
                  <div className="text-sm text-muted-foreground line-through">R$ {k.old}</div>
                  <div className="text-xs text-muted-foreground mt-1">R$ {k.per} por copo</div>
                  <div className="block mt-5">
                    <Button
                      onClick={() => handlePixPurchase(k)}
                      disabled={paymentLoading}
                      className={`w-full h-12 font-bold uppercase tracking-wider ${
                        featured
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-card border border-primary/50 text-primary hover:bg-primary/10"
                      }`}
                    >
                      <Beer className="w-4 h-4 mr-2" />{" "}
                      {paymentLoading ? "Gerando Pix..." : "Quero esse kit"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Truck className="w-3.5 h-3.5 text-primary" /> Frete grátis
                  </div>
                </div>
              );
            })}
          </div>

          {/* GARANTIA */}
          <div className="mt-12 rounded-3xl p-8 md:p-10 border border-primary/30 bg-card flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="font-display text-2xl md:text-3xl uppercase">
                Garantia incondicional de 30 dias
              </h3>
              <p className="text-muted-foreground mt-2">
                Se por qualquer motivo você não amar seu copo, devolvemos 100% do seu dinheiro.{" "}
                <strong className="text-foreground">Sem perguntas. Sem letras miúdas.</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 justify-center mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Compra 100% segura
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Envio em 24h
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Pix, cartão ou boleto
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Entrega rápida
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-5 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center mb-12">
            Dúvidas? <span className="text-shine">A gente responde</span>.
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Qual a capacidade do copo?",
                a: "São 600ml, ideal pra uma cerveja gelada de verdade — sem precisar levantar pra encher de novo no meio do jogo.",
              },
              {
                q: "Posso lavar na máquina?",
                a: "Sim! O copo é resistente e pode ir tranquilamente na lava-louças. O design não desbota.",
              },
              {
                q: "Em quanto tempo chega?",
                a: "Despachamos em até 24h úteis. A entrega varia de 3 a 8 dias úteis dependendo da sua região. Frete grátis pra todo Brasil.",
              },
              {
                q: "Posso usar pra outras bebidas?",
                a: "Com certeza. Cerveja, chopp, drinks, refrigerante, suco — qualquer bebida fica com clima de estádio.",
              },
              {
                q: "E se eu não gostar?",
                a: "Você tem 30 dias de garantia incondicional. Devolvemos 100% do seu dinheiro, sem burocracia.",
              },
              {
                q: "Vem embalado pra presente?",
                a: "Sim! Chega em embalagem premium, pronto pra entregar pro pai, marido, namorado ou amigo fã de futebol.",
              },
              {
                q: "Quais formas de pagamento?",
                a: "Aceitamos Pix (com desconto), cartão em até 3x sem juros e boleto bancário.",
              },
            ].map((f) => (
              <AccordionItem
                key={f.q}
                value={f.q}
                className="border border-border bg-card rounded-xl px-5"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-5">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-10 md:p-16 text-center relative overflow-hidden border border-primary/30"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/30 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/40 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-tight">
              A próxima partida <br /> merece o <span className="text-shine">copo certo</span>.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl mx-auto">
              Não deixa a oferta passar. Garante o seu agora, recebe em casa rapidinho e nunca mais
              bebe cerveja em copo sem graça.
            </p>
            <div className="mt-8">
              <CountdownTimer />
            </div>
            <a href="#comprar" className="inline-block mt-8">
              <Button
                size="lg"
                className="h-16 px-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-gold)] uppercase tracking-wider"
              >
                <Beer className="w-6 h-6 mr-2" /> Quero meu copo com 45% OFF
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              ⚡ Restam <strong className="text-foreground">poucas unidades</strong> no estoque
              dessa edição
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-5 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 font-display text-xl tracking-wider mb-2">
          <Trophy className="w-5 h-5 text-primary" /> <span className="text-shine">GOLEADA</span>
        </div>
        <p className="mb-1">© {new Date().getFullYear()} Goleada. Todos os direitos reservados.</p>
        <p className="text-xs">
          CNPJ 00.000.000/0001-00 · Atendimento: contato@goleada.com.br · Aprecie com moderação
        </p>
      </footer>
      <StickyBuyBar />
      <div className="h-20" aria-hidden />
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento Pix</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o codigo Pix para concluir o pagamento.
            </DialogDescription>
          </DialogHeader>

          {paymentLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Gerando pagamento Pix...
            </div>
          )}

          {paymentError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {paymentError}
            </div>
          )}

          {!paymentLoading && pixPayment && (
            <div className="space-y-4">
              {pixPayment.qr_code_base64 && (
                <div className="mx-auto w-64 max-w-full rounded-lg border border-border bg-white p-3">
                  <img
                    src={`data:image/png;base64,${pixPayment.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-semibold uppercase">{pixPayment.status}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="text-muted-foreground">Pagamento</div>
                  <div className="font-semibold">{pixPayment.payment_id}</div>
                </div>
              </div>

              <textarea
                readOnly
                value={pixPayment.qr_code ?? ""}
                className="min-h-24 w-full resize-none rounded-lg border border-border bg-card p-3 text-xs text-foreground"
              />

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={copyPixCode}
                disabled={!pixPayment.qr_code}
              >
                Copiar codigo Pix
              </Button>

              {copyFeedback && <p className="text-center text-sm text-primary">{copyFeedback}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
