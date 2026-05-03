import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Loader2, MapPin, Clock } from "lucide-react";

const Localizacoes = () => {
  const id = useIdFromUrl();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("pet_localizacoes")
        .select("*")
        .eq("pet_id", id)
        .order("data_leitura", { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Localizações" onMenuClick={() => setMenuOpen(true)} />
      <main className="max-w-2xl mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="pet-card text-center text-muted-foreground">
            Nenhuma localização registrada ainda.
          </div>
        ) : (
          items.map((it) => (
            <a
              key={it.id}
              href={`https://maps.google.com/?q=${it.latitude},${it.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pet-card block hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-all">
                    {it.endereco || `${Number(it.latitude).toFixed(5)}, ${Number(it.longitude).toFixed(5)}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(it.data_leitura).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </main>
    </div>
  );
};

export default Localizacoes;
