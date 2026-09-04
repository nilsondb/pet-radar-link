import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { publicPetPhotoUrl, useIdFromUrl, uploadPetPhoto } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { logPetEvento } from "@/lib/petEventos";

const Edit = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!id) {
      navigate("/meus-pets", { replace: true });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("id,nome,data_nascimento,peso_kg,foto_path,status_perdido,tutor_id")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        navigate("/meus-pets", { replace: true });
        return;
      }

      const { data: tutorData } = await supabase
        .from("tutores")
        .select("id,nome,telefone,email,endereco")
        .eq("id", data.tutor_id)
        .maybeSingle();

      setPet({ ...data, peso_original: data.peso_kg });
      setTutor(tutorData);
      setPreview(publicPetPhotoUrl(data.foto_path) || "");
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleFile = (f: File | null) => {
    setFoto(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pet || !tutor) return;
    setSaving(true);
    try {
      let fotoPath = pet.foto_path;
      if (foto) fotoPath = await uploadPetPhoto(id, foto);

      const novoPeso = pet.peso_kg === "" || pet.peso_kg == null ? null : Number(pet.peso_kg);
      const pesoAntes = pet.peso_original;

      const { error: petError } = await supabase
        .from("pets")
        .update({
          nome: pet.nome.trim(),
          data_nascimento: pet.data_nascimento || null,
          peso_kg: novoPeso,
          foto_path: fotoPath,
        })
        .eq("id", id);
      if (petError) throw petError;

      const { error: tutorError } = await supabase
        .from("tutores")
        .update({
          nome: tutor.nome.trim(),
          telefone: tutor.telefone?.trim() || null,
          email: tutor.email?.trim() || null,
          endereco: tutor.endereco?.trim() || null,
        })
        .eq("id", tutor.id);
      if (tutorError) throw tutorError;

      if (novoPeso != null && Number(pesoAntes) !== novoPeso) {
        await logPetEvento(id, "peso", `⚖️ Peso atualizado: ${novoPeso} kg`, null, { peso_kg: novoPeso });
        setPet((p: any) => ({ ...p, peso_original: novoPeso }));
      }

      setPet((p: any) => ({ ...p, foto_path: fotoPath, peso_kg: novoPeso }));
      setPreview(publicPetPhotoUrl(fotoPath) || "");
      setFoto(null);
      toast.success("Alterações salvas! 💜");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (perdido: boolean) => {
    if (!id) return;
    const { error } = await supabase.rpc("definir_status_perdido" as any, {
      p_pet_id: id,
      p_perdido: perdido,
    } as any);
    if (error) return toast.error(error.message);
    setPet({ ...pet, status_perdido: perdido });
    toast.success(perdido ? "Marcado como perdido 🚨" : "Pet encontrado ✅");
  };

  if (loading || !pet || !tutor) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Editar cadastro" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSave} className="pet-card space-y-4">
          <div className="flex flex-col items-center gap-3">
            {preview ? <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/30" /> : <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center"><PawPrint className="w-12 h-12 text-muted-foreground" /></div>}
            <Input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="max-w-xs" />
          </div>

          <div><Label>Nome do pet</Label><Input value={pet.nome} onChange={(e) => setPet({ ...pet, nome: e.target.value })} /></div>
          <div><Label>Data de nascimento</Label><Input type="date" value={pet.data_nascimento || ""} onChange={(e) => setPet({ ...pet, data_nascimento: e.target.value })} /></div>
          <div><Label>Peso (kg)</Label><Input type="number" step="0.1" min="0" placeholder="Ex: 8.5" value={pet.peso_kg ?? ""} onChange={(e) => setPet({ ...pet, peso_kg: e.target.value })} /></div>

          <div className="pt-2 border-t">
            <p className="text-sm font-semibold mb-3">Dados do tutor</p>
            <div className="space-y-4">
              <div><Label>Nome do tutor</Label><Input value={tutor.nome || ""} onChange={(e) => setTutor({ ...tutor, nome: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={tutor.telefone || ""} onChange={(e) => setTutor({ ...tutor, telefone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={tutor.email || ""} onChange={(e) => setTutor({ ...tutor, email: e.target.value })} /></div>
              <div><Label>Endereço</Label><Input value={tutor.endereco || ""} onChange={(e) => setTutor({ ...tutor, endereco: e.target.value })} /></div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full" size="lg">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar alterações</Button>
        </form>

        <div className="pet-card mt-4 space-y-3">
          {pet.status_perdido ? <Button onClick={() => setStatus(false)} className="w-full bg-success hover:bg-success/90 text-success-foreground" size="lg">✅ Pet encontrado</Button> : <Button onClick={() => setStatus(true)} variant="destructive" className="w-full" size="lg">🚨 Marcar como perdido</Button>}
        </div>
      </main>
    </div>
  );
};

export default Edit;
