import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Sparkles, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { logPetEvento } from "@/lib/petEventos";

const MAX_BYTES = 10 * 1024 * 1024;
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(((reader.result as string).split(",")[1]) ?? ""); reader.onerror = reject; reader.readAsDataURL(file); });

const AssistenteIA = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(true);
  const [petNome, setPetNome] = useState("seu pet");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) { navigate("/setup"); return; }
    (async () => {
      const { data } = await supabase.from("pets").select("id,nome").eq("id", id).eq("ativo", true).maybeSingle();
      if (!data) { navigate(`/setup?id=${id}`, { replace: true }); return; }
      setPetNome(data.nome || "seu pet");
      setValidando(false);
    })();
  }, [id, navigate]);

  if (!id || validando) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const onPickFile = (f: File | null) => {
    if (!f) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(f.type)) return void toast.error("Formato não suportado. Use PDF, PNG, JPG ou WEBP.");
    if (f.size > MAX_BYTES) return void toast.error("Arquivo muito grande (máx 10MB)");
    setFile(f);
  };

  const analisar = async () => {
    if (!pergunta.trim() && !file) return void toast.error("Digite uma pergunta ou anexe um exame");
    setLoading(true); setResposta("");
    try {
      const body: any = { pet_id: id, pergunta: pergunta.trim() };
      if (file) { body.fileBase64 = await fileToBase64(file); body.fileMime = file.type; body.fileName = file.name; }
      const { data, error } = await supabase.functions.invoke("ia-exame", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResposta((data as any).resposta);
      await logPetEvento(id, "consulta_ia", "🤖 Consulta ao Assistente IA", pergunta ? pergunta.slice(0, 200) : `Arquivo: ${file?.name}`, { tem_arquivo: !!file });
    } catch (e: any) { toast.error(e.message || "Erro ao analisar"); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen">
    <PetSidebar id={id} open={menuOpen} onClose={() => setMenuOpen(false)} />
    <PetHeader title="Assistente IA" onMenuClick={() => setMenuOpen(true)} />
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="pet-card space-y-3">
        <div className="flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /><h2 className="text-lg font-bold">Assistente IA de {petNome}</h2></div>
        <p className="text-sm text-muted-foreground">Pergunte sobre o histórico de {petNome}, cole resultados de exames ou envie um PDF/imagem. A análise fica limitada ao pet selecionado.</p>
        <Textarea value={pergunta} onChange={(e)=>setPergunta(e.target.value)} placeholder={`Ex.: explique o hemograma de ${petNome} em linguagem simples...`} className="min-h-[120px]" maxLength={8000}/>
        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>onPickFile(e.target.files?.[0]??null)}/>
        {file ? <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">{file.type==="application/pdf"?<FileText className="w-5 h-5 text-primary shrink-0"/>:<ImageIcon className="w-5 h-5 text-primary shrink-0"/>}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size/1024).toFixed(0)} KB</p></div><button type="button" onClick={()=>{setFile(null);if(fileRef.current)fileRef.current.value="";}} className="p-1 rounded hover:bg-background" aria-label="Remover arquivo"><X className="w-4 h-4"/></button></div> : <Button type="button" variant="outline" onClick={()=>fileRef.current?.click()} className="w-full"><Paperclip className="w-4 h-4 mr-2"/>Anexar PDF ou imagem</Button>}
        <Button onClick={analisar} disabled={loading} className="w-full" size="lg">{loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Analisando...</>:<><Sparkles className="w-4 h-4 mr-2"/>Analisar com IA</>}</Button>
      </div>
      {resposta&&<div className="pet-card"><h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>Resposta</h3><div className="prose prose-sm max-w-none text-foreground leading-relaxed [&_h1]:text-base [&_h2]:text-base [&_h3]:text-base [&_strong]:text-foreground"><ReactMarkdown>{resposta}</ReactMarkdown></div></div>}
      <p className="text-xs text-muted-foreground text-center px-2">⚠️ A IA oferece informação educativa e apoio à compreensão. Não realiza diagnóstico nem substitui consulta, avaliação ou tratamento por médico-veterinário.</p>
    </main>
  </div>;
};
export default AssistenteIA;
