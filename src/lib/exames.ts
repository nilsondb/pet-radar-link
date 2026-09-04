import { supabase } from "@/integrations/supabase/client";

const BUCKET = "pet-exames";

export function exameStoragePath(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const m = valor.match(/pet-exames\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : valor;
}

/** Abre exame privado por URL assinada de curta duração. */
export async function abrirExame(valor: string | null | undefined) {
  const path = exameStoragePath(valor);
  if (!path) return;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

/** Faz upload e devolve somente o caminho interno do bucket privado. */
export async function uploadExame(petId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${petId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function removerExameArquivo(valor: string | null | undefined) {
  const path = exameStoragePath(valor);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
