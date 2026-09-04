import { supabase } from "@/integrations/supabase/client";

export type PetResumo = {
  id: string;
  token: string | null;
  nome_pet: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  status_perdido: boolean;
  status_ativado: boolean;
  ultima_localizacao: string | null;
  ultima_leitura: string | null;
  tutor_id: string | null;
};

export type Tutor = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
};

const PET_FIELDS =
  "id, token, nome_pet, foto_url, data_nascimento, status_perdido, status_ativado, ultima_localizacao, ultima_leitura, tutor_id";

/** Carrega o pet atual (identificado pela tag) com os campos usados nos cards. */
export async function fetchPetResumo(petId: string): Promise<PetResumo | null> {
  const { data } = await supabase
    .from("pets")
    .select(PET_FIELDS)
    .eq("id", petId)
    .maybeSingle();
  return (data as PetResumo) ?? null;
}

/** Lista todos os pets de um tutor. Se não houver tutor, retorna apenas o pet atual. */
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
  return (data as PetResumo[]) || [];
}

export async function fetchTutor(tutorId: string): Promise<Tutor | null> {
  const { data } = await supabase
    .from("tutores")
    .select("id, nome, telefone, email, endereco")
    .eq("id", tutorId)
    .maybeSingle();
  return (data as Tutor) ?? null;
}

/**
 * Garante que exista um tutor para os dados informados e devolve o id.
 * Reaproveita um tutor existente com o mesmo telefone (normalizado).
 */
export async function ensureTutor(dados: {
  nome: string;
  telefone: string;
  endereco?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const tel = (dados.telefone || "").replace(/\D/g, "");
  if (!tel) return null;

  const { data: existentes } = await supabase.from("tutores").select("id, telefone");
  const achado = (existentes || []).find(
    (t: any) => (t.telefone || "").replace(/\D/g, "") === tel
  );
  if (achado) {
    await supabase
      .from("tutores")
      .update({
        nome: dados.nome || undefined,
        endereco: dados.endereco ?? undefined,
        email: dados.email ?? undefined,
      })
      .eq("id", achado.id);
    return achado.id;
  }

  const { data, error } = await supabase
    .from("tutores")
    .insert({
      nome: dados.nome || "Tutor",
      telefone: dados.telefone,
      endereco: dados.endereco ?? null,
      email: dados.email ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

/** Monta a querystring padrão de acesso privado a um pet (sem token NFC). */
export function petQuery(id: string) {
  return `?id=${id}`;
}

/** id do tutor da sessão autenticada (resolvido no servidor por auth.uid()). */
export async function fetchMeuTutorId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("meu_tutor_id");
  if (error) return null;
  return (data as string | null) ?? null;
}

/** Tutor da conta autenticada, respeitando a RLS. */
export async function fetchMeuTutor(): Promise<Tutor | null> {
  const tutorId = await fetchMeuTutorId();
  if (!tutorId) return null;
  return fetchTutor(tutorId);
}

/** Pets vinculados ao tutor da conta autenticada. */
export async function fetchMeusPets(): Promise<PetResumo[]> {
  const tutorId = await fetchMeuTutorId();
  if (!tutorId) return [];
  const { data } = await supabase
    .from("pets")
    .select(PET_FIELDS)
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: true });
  return (data as PetResumo[]) || [];
}

/** Ativa (ou substitui) a TAG de um pet que já existe. Nunca cria um novo pet. */
export async function ativarTagParaPet(uid: string, token: string): Promise<string> {
  const { data, error } = await supabase.rpc("ativar_tag_para_pet", {
    p_uid: uid.trim(),
    p_token: token.trim(),
  });
  if (error) throw error;
  return data as string;
}

/** Solicitações de TAG do pet visíveis para o tutor. */
export async function fetchSolicitacoesTagDoPet(petId: string) {
  const { data } = await supabase
    .from("tag_solicitacoes")
    .select("id, status, tag_uid, created_at")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });
  return data || [];
}
