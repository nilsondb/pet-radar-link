import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, uploadPetPhoto } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { PetSidebar } from "@/components/PetSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PawPrint } from "lucide-react";
import { toast } from "sonner";

const Edit = () => {
  const id = useIdFromUrl();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("pets").select("*").eq("id", id).maybeSingle();
      if (!data) navigate(`/setup?id=${id}`, { replace: true });
      else {
        setPet(data);
        setPreview(data.foto_url || "");
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleFile = (f: File | null) => {
    setFoto(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pet) return;
    setSaving(true);
    try {
      let foto_url = pet.foto_url;
      if (foto) foto_url = await uploadPetPhoto(id, foto);

      const { error } = await supabase.from("pets").update({
        nome_pet: pet.nome_pet,
        data_nascimento: pet.data_nascimento || null,
        nome_dono: pet.nome_dono,
        telefone: pet.telefone,
        endereco: pet.endereco,
        foto_url,
      }).eq("id", id);
      if (error) throw error;
      toast.success("Alterações salvas! 💜");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (perdido: boolean) => {
    if (!id) return;
    const { error } = await supabase.from("pets").update({
      status_perdido: perdido,
      data_perdido: perdido ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    setPet({ ...pet, status_perdido: perdido });
    toast.success(perdido ? "Marcado como perdido 🚨" : "Pet encontrado ✅");
  };

  if (loading || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetSidebar id={id!} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <PetHeader title="Editar cadastro" onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSave} className="pet-card space-y-4">
          <div className="flex flex-col items-center gap-3">
            {preview ? (
              <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/30" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <PawPrint className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="max-w-xs" />
          </div>

          <div>
            <Label>Nome do pet</Label>
            <Input value={pet.nome_pet} onChange={(e) => setPet({ ...pet, nome_pet: e.target.value })} />
          </div>
          <div>
            <Label>Data de nascimento</Label>
            <Input type="date" value={pet.data_nascimento || ""} onChange={(e) => setPet({ ...pet, data_nascimento: e.target.value })} />
          </div>
          <div>
            <Label>Nome do dono</Label>
            <Input value={pet.nome_dono} onChange={(e) => setPet({ ...pet, nome_dono: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={pet.telefone} onChange={(e) => setPet({ ...pet, telefone: e.target.value })} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={pet.endereco || ""} onChange={(e) => setPet({ ...pet, endereco: e.target.value })} />
          </div>

          <Button type="submit" disabled={saving} className="w-full" size="lg">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar alterações
          </Button>
        </form>

        <div className="pet-card mt-4 space-y-3">
          {pet.status_perdido ? (
            <Button onClick={() => setStatus(false)} className="w-full bg-success hover:bg-success/90 text-success-foreground" size="lg">
              ✅ Pet encontrado
            </Button>
          ) : (
            <Button onClick={() => setStatus(true)} variant="destructive" className="w-full" size="lg">
              🚨 Marcar como perdido
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Edit;
