import { useEffect, useState } from "react";

function getTarget() {
  if (typeof window === "undefined") return Date.now() + 3600_000;
  const key = "goleada_offer_end";
  const stored = window.localStorage.getItem(key);
  if (stored) {
    const t = parseInt(stored, 10);
    if (!isNaN(t) && t > Date.now()) return t;
  }
  const t = Date.now() + 1000 * 60 * 60 * 2; // 2h
  window.localStorage.setItem(key, String(t));
  return t;
}

export function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const [end, setEnd] = useState<number>(() => Date.now() + 7200_000);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setEnd(getTarget());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className="font-display tabular-nums text-primary">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    );
  }

  return (
    <div className="flex gap-2 justify-center">
      {[
        { v: pad(h), l: "horas" },
        { v: pad(m), l: "min" },
        { v: pad(s), l: "seg" },
      ].map((x) => (
        <div key={x.l} className="bg-background/60 backdrop-blur border border-primary/30 rounded-xl px-4 py-3 min-w-[72px]">
          <div className="font-display text-3xl text-primary tabular-nums">{x.v}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.l}</div>
        </div>
      ))}
    </div>
  );
}