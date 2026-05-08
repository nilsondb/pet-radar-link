import { supabase } from "@/integrations/supabase/client";

export type TipoEvento =
  | "vacina"
  | "vermifugo"
  | "medicamento"
  | "exame"
  | "localizacao"
  | "consulta_ia"
  | "peso"
  | "status_pet";

export async function logPetEvento(
  petId: string,
  tipo_evento: TipoEvento,
  titulo: string,
  descricao?: string | null,
  dados_json?: Record<string, any> | null
) {
  try {
    await supabase.from("pet_eventos").insert({
      pet_id: petId,
      tipo_evento,
      titulo,
      descricao: descricao ?? null,
      dados_json: (dados_json as any) ?? null,
    });
  } catch (e) {
    console.warn("logPetEvento failed", e);
  }
}
