import { supabase } from "@/integrations/supabase/client";
import { publicPetPhotoUrl } from "@/lib/petUtils";

export type PetResumo = {
  id: string;
  codigo_publico: string;
  nome_pet: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  status_perdido: boolean;
  tutor_id: string | null;
};

export type Tutor = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
};

function mapPet(row: any): PetResumo {
  return {
    id: row.id,
    codigo_publico: row.codigo_publico,
    nome_pet: row.nome ?? null,
    foto_url: publicPetPhotoUrl(row.foto_path),
    data_nascimento: row.data_nascimento ?? null,
    status_perdido: !!row.status_perdido,
    tutor_id: row.tutor_id ?? null,
  };
}

const PET_FIELDS =
  "id, codigo_publico, nome, foto_path, data_nascimento, status_perdido, tutor_id";

export async function fetchPetResumo(petId: string): Promise<PetResumo | null> {
  const { data } = await supabase
    .from("pets")
    .select(PET_FIELDS)
    .eq("id", petId)
    .maybeSingle();
  return data ? mapPet(data) : null;
}

export async function fetchPetsDoTutor(
  tutorId: string | null,
  petIdFallback: string
): Promise<PetResumo[]> {
  if (!tutorId) {
    const pet = await fetchPetResumo(petIdFallback);
    return pet ? [pet] : [];
  }

  const { data } = await supabase
    .from("pets")
    .select(PET_FIELDS)
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: true });

  return (data || []).map(mapPet);
}

export async function fetchTutor(tutorId: string): Promise<Tutor | null> {
  const { data } = await supabase
    .from("tutores")
    .select("id, nome, telefone, email, endereco")
    .eq("id", tutorId)
    .maybeSingle();
  return (data as Tutor) ?? null;
}

export async function ensureTutor(dados: {
  nome: string;
  telefone: string;
  endereco?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: existente } = await supabase
    .from("tutores")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("tutores")
      .update({
        nome: dados.nome || "Tutor",
        telefone: dados.telefone || null,
        endereco: dados.endereco ?? null,
        email: dados.email ?? null,
      })
      .eq("id", existente.id);
    if (error) return null;
    return existente.id;
  }

  const { data, error } = await supabase
    .from("tutores")
    .insert({
      user_id: userId,
      nome: dados.nome || "Tutor",
      telefone: dados.telefone || null,
      endereco: dados.endereco ?? null,
      email: dados.email ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
}

export function petQuery(id: string) {
  return `?id=${id}`;
}

export async function fetchMeuTutorId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("meu_tutor_id");
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function fetchMeuTutor(): Promise<Tutor | null> {
  const tutorId = await fetchMeuTutorId();
  if (!tutorId) return null;
  return fetchTutor(tutorId);
}

export async function fetchMeusPets(): Promise<PetResumo[]> {
  const tutorId = await fetchMeuTutorId();
  if (!tutorId) return [];

  const { data } = await supabase
    .from("pets")
    .select(PET_FIELDS)
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: true });

  return (data || []).map(mapPet);
}

export async function ativarTagParaPet(
  petId: string,
  uid: string,
  token: string
): Promise<string> {
  const { data, error } = await supabase.rpc("ativar_tag_para_pet", {
    p_pet_id: petId,
    p_uid: uid.trim(),
    p_token: token.trim(),
  });
  if (error) throw error;
  return data as string;
}

export async function fetchSolicitacoesTagDoPet(petId: string) {
  const { data } = await supabase
    .from("tag_solicitacoes")
    .select("id, status, tag_uid, created_at")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });
  return data || [];
}
