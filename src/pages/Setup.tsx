import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdFromUrl, useTokenFromUrl, uploadPetPhoto, validateActivationToken } from "@/lib/petUtils";
import { PetHeader } from "@/components/PetHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PawPrint, ShieldAlert } from "lucide-react";

const Setup = () => {
  const id = useIdFromUrl();
  const token = useTokenFromUrl();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [form, setForm] = useState({
    nome_pet: "",
    data_nascimento: "",
    peso: "",
    nome_dono: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    if (!id) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data: existing } = await supabase.from("pets").select("id").eq("id", id).maybeSingle();
      if (existing) {
        const qs = token ? `?id=${id}&token=${token}` : `?id=${id}`;
        navigate(`/dashboard${qs}`, { replace: true });
        return;
      }
      if (!token) {
        setTokenValid(false);
        setChecking(false);
        return;
      }
      const valid = await validateActivationToken(id, token);
      setTokenValid(valid);
      setChecking(false);
    })();
  }, [id, token, navigate]);

  const handleFile = (f: File | null) => {
    setFoto(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      let foto_url: string | null = null;
      if (foto) foto_url = await uploadPetPhoto(id, foto);

      const { peso, ...rest } = form;
      const { error } = await supabase.from("pets").insert({
        id,
        ...rest,
        data_nascimento: rest.data_nascimento || null,
        peso: peso ? Number(peso) : null,
        foto_url,
      });
      if (error) throw error;
      toast.success("Pet cadastrado com sucesso! 🐾");
      navigate(`/dashboard?id=${id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="pet-card max-w-md text-center">
          <PawPrint className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-xl font-bold mb-2">ID não encontrado</h1>
          <p className="text-muted-foreground">
            Aproxime sua tag NFC ou abra o link com <code>?id=SEU_ID</code>.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PetHeader title="Cadastrar pet" />
      <main className="max-w-2xl mx-auto p-4">
        <div className="pet-card">
          <p className="text-sm text-muted-foreground mb-4">
            Tag <span className="font-mono font-medium">#{id}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/30" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <PawPrint className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="max-w-xs"
              />
            </div>

            <div>
              <Label htmlFor="nome_pet">Nome do pet *</Label>
              <Input id="nome_pet" required value={form.nome_pet}
                onChange={(e) => setForm({ ...form, nome_pet: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="data_nascimento">Data de nascimento</Label>
              <Input id="data_nascimento" type="date" value={form.data_nascimento}
                onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input id="peso" type="number" step="0.1" min="0" placeholder="Ex: 8.5" value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="nome_dono">Nome do dono *</Label>
              <Input id="nome_dono" required value={form.nome_dono}
                onChange={(e) => setForm({ ...form, nome_dono: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone (com DDD) *</Label>
              <Input id="telefone" required placeholder="11999999999" value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>

            <Button type="submit" disabled={saving} className="w-full" size="lg">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar e ativar
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Setup;
