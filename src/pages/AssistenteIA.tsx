import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AssistenteIA = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  if (!id) {
    navigate("/setup");
    return null;
  }

  const analisar = async () => {
    if (!pergunta.trim()) {
      toast.error("Digite ou cole um exame");
      return;
    }
    setLoading(true);
    setResposta("");
    try {
      const { data, error } = await supabase.functions.invoke("ia-exame", {
        body: { pergunta },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResposta((data as any).resposta);
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PetSidebar id={id} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Assistente IA" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="pet-card space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">🤖 Assistente IA</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Cole o resultado de um exame ou descreva os sintomas para receber uma explicação simples e educativa.
          </p>
          <Textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Cole o exame ou descreva o resultado..."
            className="min-h-[140px]"
            maxLength={8000}
          />
          <Button onClick={analisar} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Analisar exame</>
            )}
          </Button>
        </div>

        {resposta && (
          <div className="pet-card">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Resposta
            </h3>
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed [&_h1]:text-base [&_h2]:text-base [&_h3]:text-base [&_strong]:text-foreground">
              <ReactMarkdown>{resposta}</ReactMarkdown>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center px-2">
          ⚠️ Este assistente não substitui um veterinário. Procure um profissional para avaliação completa.
        </p>
      </main>
    </div>
  );
};

export default AssistenteIA;
