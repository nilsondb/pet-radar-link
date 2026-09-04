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

/**
 * Salva a foto no Storage e devolve apenas o caminho interno.
 * O banco guarda foto_path; a URL pública/assinada é resolvida na leitura.
 */
export async function uploadPetPhoto(petId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${petId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("pet-photos").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export function publicPetPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
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

/**
 * Não valida segredo no navegador.
 * A confirmação real do token acontece exclusivamente nas RPCs do servidor.
 */
export async function validateActivationToken(id: string, token: string): Promise<boolean> {
  if (!id.trim() || !token.trim()) return false;
  const { data, error } = await supabase.rpc("pet_status_ativacao", { p_id: id.trim() });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return !row?.ativado;
}
