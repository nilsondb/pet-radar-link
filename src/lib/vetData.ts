import { supabase } from "@/integrations/supabase/client";
import { publicPetPhotoUrl } from "@/lib/petUtils";

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
  "id, pet_id, veterinarian_id, status, access_level, requested_at, authorized_at, pet:pets(id, nome, foto_path, raca, especie, sexo, data_nascimento, status_perdido, tutor_id, tutor:tutores(nome, telefone))";

function mapPaciente(row: any): PacienteVinculo {
  const pet = row.pet
    ? {
        id: row.pet.id,
        nome_pet: row.pet.nome ?? null,
        foto_url: publicPetPhotoUrl(row.pet.foto_path),
        raca: row.pet.raca ?? null,
        especie: row.pet.especie ?? null,
        sexo: row.pet.sexo ?? null,
        data_nascimento: row.pet.data_nascimento ?? null,
        status_perdido: !!row.pet.status_perdido,
        nome_dono: row.pet.tutor?.nome ?? null,
        telefone: row.pet.tutor?.telefone ?? null,
        tutor_id: row.pet.tutor_id ?? null,
      }
    : null;

  return { ...row, pet } as PacienteVinculo;
}

export async function fetchPacientes(vetId: string, status?: VinculoStatus) {
  let q = supabase
    .from("pet_veterinarians")
    .select(SELECT)
    .eq("veterinarian_id", vetId)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data || []).map(mapPaciente);
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
  const patch: { status: VinculoStatus; authorized_at?: string; revoked_at?: string } = { status };
  if (status === "active") patch.authorized_at = new Date().toISOString();
  if (status === "revoked") patch.revoked_at = new Date().toISOString();
  const { error } = await supabase.from("pet_veterinarians").update(patch).eq("id", id);
  if (error) throw error;
}

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

export type PetPorTag = {
  pet_id: string;
  nome_pet: string | null;
  foto_url: string | null;
  especie: string | null;
  raca: string | null;
  sexo: string | null;
  tag_uid: string | null;
  tutor_nome: string | null;
  vinculo_status: VinculoStatus | null;
};

export async function buscarPetPorTag(uid: string): Promise<PetPorTag | null> {
  const { data, error } = await supabase.rpc("vet_buscar_pet_por_tag", { p_uid: uid.trim() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PetPorTag) ?? null;
}

export async function criarPacienteSemTag(dados: {
  nome_pet: string;
  especie?: string;
  raca?: string;
  sexo?: string;
  data_nascimento?: string;
  peso?: string;
  tutor_nome?: string;
  tutor_telefone?: string;
  tutor_email?: string;
  observacoes?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("vet_criar_paciente", {
    p_nome_pet: dados.nome_pet.trim(),
    p_especie: dados.especie || null,
    p_raca: dados.raca || null,
    p_sexo: dados.sexo || null,
    p_data_nascimento: dados.data_nascimento || null,
    p_peso: dados.peso ? Number(dados.peso) : null,
    p_tutor_nome: dados.tutor_nome || null,
    p_tutor_telefone: dados.tutor_telefone || null,
    p_tutor_email: dados.tutor_email || null,
    p_observacoes: dados.observacoes || null,
  });
  if (error) throw error;
  return data as string;
}

export async function solicitarTag(petId: string, vetId: string, observacoes?: string) {
  const { error } = await supabase.from("tag_solicitacoes").insert({
    pet_id: petId,
    veterinarian_id: vetId,
    status: "pending",
    observacoes: observacoes || null,
  });
  if (error) throw error;
}

export async function fetchSolicitacoesTagDoVet(vetId: string) {
  const { data } = await supabase
    .from("tag_solicitacoes")
    .select("id, pet_id, status, created_at, tag_uid")
    .eq("veterinarian_id", vetId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function fetchTagAtivaDoPet(petId: string) {
  const { data } = await supabase
    .from("tags")
    .select("uid_publico, status, activated_at")
    .eq("pet_id", petId)
    .eq("status", "active")
    .maybeSingle();
  return data;
}
