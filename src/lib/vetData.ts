import { supabase } from "@/integrations/supabase/client";

export type VinculoStatus = "pending" | "active" | "revoked";

export type PacienteVinculo = {
  id: string;
  pet_id: string;
  veterinarian_id: string;
  status: VinculoStatus;
  access_level: string;
  requested_at: string;
  authorized_at: string | null;
  pet: {
    id: string;
    nome_pet: string | null;
    foto_url: string | null;
    raca: string | null;
    especie: string | null;
    sexo: string | null;
    data_nascimento: string | null;
    status_perdido: boolean;
    nome_dono: string | null;
    telefone: string | null;
    tutor_id: string | null;
  } | null;
};

const SELECT =
  "id, pet_id, veterinarian_id, status, access_level, requested_at, authorized_at, pet:pets(id, nome_pet, foto_url, raca, especie, sexo, data_nascimento, status_perdido, nome_dono, telefone, tutor_id)";

export async function fetchPacientes(vetId: string, status?: VinculoStatus) {
  let q = supabase
    .from("pet_veterinarians")
    .select(SELECT)
    .eq("veterinarian_id", vetId)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data as unknown as PacienteVinculo[]) || [];
}

export async function fetchVinculosDoPet(petId: string) {
  const { data } = await supabase
    .from("pet_veterinarians")
    .select(
      "id, status, access_level, requested_at, authorized_at, revoked_at, veterinarian_id, vet:veterinarios(id, nome, crmv, uf_crmv, clinica, especialidade, telefone, email)"
    )
    .eq("pet_id", petId)
    .order("requested_at", { ascending: false });
  return (data as any[]) || [];
}

export async function solicitarAcesso(petId: string, vetId: string, access_level = "health") {
  const { data: existente } = await supabase
    .from("pet_veterinarians")
    .select("id, status")
    .eq("pet_id", petId)
    .eq("veterinarian_id", vetId)
    .maybeSingle();

  if (existente) {
    if (existente.status === "active") return { status: "active" as const };
    const { error } = await supabase
      .from("pet_veterinarians")
      .update({ status: "pending", requested_at: new Date().toISOString(), revoked_at: null })
      .eq("id", existente.id);
    if (error) throw error;
    return { status: "pending" as const };
  }

  const { error } = await supabase
    .from("pet_veterinarians")
    .insert({ pet_id: petId, veterinarian_id: vetId, status: "pending", access_level });
  if (error) throw error;
  return { status: "pending" as const };
}

export async function atualizarVinculo(id: string, status: VinculoStatus) {
  const patch: { status: string; authorized_at?: string; revoked_at?: string } = { status };
  if (status === "active") patch.authorized_at = new Date().toISOString();
  if (status === "revoked") patch.revoked_at = new Date().toISOString();
  const { error } = await supabase.from("pet_veterinarians").update(patch).eq("id", id);
  if (error) throw error;
}

/** Verifica se o veterinário tem vínculo ativo com o pet (checagem no banco). */
export async function temAcessoAtivo(petId: string, vetId: string) {
  const { data } = await supabase
    .from("pet_veterinarians")
    .select("id, access_level")
    .eq("pet_id", petId)
    .eq("veterinarian_id", vetId)
    .eq("status", "active")
    .maybeSingle();
  return data ? { ok: true, access_level: data.access_level } : { ok: false, access_level: null };
}
