import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { Beer } from "lucide-react";

export function StickyBuyBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-background/95 backdrop-blur-xl border-t border-primary/30 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 justify-between">
          <div className="hidden sm:block">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Oferta acaba em</div>
            <CountdownTimer compact />
          </div>
          <div className="flex items-center gap-3 flex-1 sm:flex-none justify-end">
            <div className="text-right leading-tight">
              <div className="text-xs text-muted-foreground line-through">R$ 89,90</div>
              <div className="font-display text-2xl text-primary">R$ 49,90</div>
            </div>
            <a href="#comprar">
              <Button size="lg" className="h-12 px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                <Beer className="w-5 h-5 mr-2" /> Comprar
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}