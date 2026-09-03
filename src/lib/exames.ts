import { supabase } from "@/integrations/supabase/client";

const BUCKET = "pet-exames";

/** Converte URLs legadas (públicas) e caminhos novos no caminho interno do bucket. */
export function exameStoragePath(valor: string | null): string | null {
  if (!valor) return null;
  const m = valor.match(/pet-exames\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : valor;
}

/** Gera um link temporário e abre o arquivo do exame (bucket privado). */
export async function abrirExame(valor: string | null) {
  const path = exameStoragePath(valor);
  if (!path) return;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

/** Faz upload do exame e devolve o caminho interno (não público). */
export async function uploadExame(petId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${petId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}
