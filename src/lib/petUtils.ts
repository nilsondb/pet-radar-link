import { supabase } from "@/integrations/supabase/client";

export function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return "—";
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  if (meses < 0 || (meses === 0 && hoje.getDate() < nasc.getDate())) {
    anos--;
    meses += 12;
  }
  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

export function formatTelefoneWA(tel: string): string {
  return tel.replace(/\D/g, "");
}

export async function uploadPetPhoto(petId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${petId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("pet-photos").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
  return data.publicUrl;
}

export function useIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

export function useTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export async function validateActivationToken(id: string, token: string): Promise<boolean> {
  const { data } = await supabase
    .from("activation_tokens")
    .select("token")
    .eq("id", id)
    .maybeSingle();
  return !!data && data.token === token;
}
