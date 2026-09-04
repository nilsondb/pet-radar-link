export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activation_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          id: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      admins: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string | null
          senha_hash: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          senha_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          senha_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_metrics: {
        Row: {
          active_users: number
          annual_revenue: number
          cancellations_month: number
          custom_metrics: Json
          id: string
          last_update: string
          monthly_revenue: number
          new_users_month: number
          new_users_today: number
          premium_users: number
          total_subscriptions: number
          total_users: number
        }
        Insert: {
          active_users?: number
          annual_revenue?: number
          cancellations_month?: number
          custom_metrics?: Json
          id?: string
          last_update?: string
          monthly_revenue?: number
          new_users_month?: number
          new_users_today?: number
          premium_users?: number
          total_subscriptions?: number
          total_users?: number
        }
        Update: {
          active_users?: number
          annual_revenue?: number
          cancellations_month?: number
          custom_metrics?: Json
          id?: string
          last_update?: string
          monthly_revenue?: number
          new_users_month?: number
          new_users_today?: number
          premium_users?: number
          total_subscriptions?: number
          total_users?: number
        }
        Relationships: []
      }
      atendimentos_veterinarios: {
        Row: {
          anamnese: string | null
          created_at: string
          data_atendimento: string
          id: string
          motivo: string | null
          observacoes: string | null
          pet_id: string
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          anamnese?: string | null
          created_at?: string
          data_atendimento?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          pet_id: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          anamnese?: string | null
          created_at?: string
          data_atendimento?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          pet_id?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_veterinarios_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_veterinarios_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      exames: {
        Row: {
          arquivo_url: string | null
          created_at: string
          created_by_role: string
          created_by_user: string | null
          data_exame: string | null
          id: string
          nome_exame: string
          observacoes: string | null
          pet_id: string
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_exame?: string | null
          id?: string
          nome_exame: string
          observacoes?: string | null
          pet_id: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_exame?: string | null
          id?: string
          nome_exame?: string
          observacoes?: string | null
          pet_id?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exames_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          integration_token: string | null
          last_sync: string | null
          saas_center_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          integration_token?: string | null
          last_sync?: string | null
          saas_center_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          integration_token?: string | null
          last_sync?: string | null
          saas_center_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      medicamentos: {
        Row: {
          created_at: string
          created_by_role: string
          created_by_user: string | null
          data_fim: string | null
          data_inicio: string | null
          dosagem: string | null
          frequencia: string | null
          horario: string | null
          id: string
          nome_medicamento: string
          observacoes: string | null
          pet_id: string
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dosagem?: string | null
          frequencia?: string | null
          horario?: string | null
          id?: string
          nome_medicamento: string
          observacoes?: string | null
          pet_id: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dosagem?: string | null
          frequencia?: string | null
          horario?: string | null
          id?: string
          nome_medicamento?: string
          observacoes?: string | null
          pet_id?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string | null
          descricao: string | null
          id: string
          pet_id: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          pet_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          pet_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      pet_eventos: {
        Row: {
          created_at: string
          created_by_role: string
          created_by_user: string | null
          dados_json: Json | null
          descricao: string | null
          id: string
          pet_id: string
          tipo_evento: string
          titulo: string
          veterinarian_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id: string
          tipo_evento: string
          titulo: string
          veterinarian_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id?: string
          tipo_evento?: string
          titulo?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_eventos_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_localizacoes: {
        Row: {
          data_leitura: string
          endereco: string | null
          id: string
          latitude: number
          longitude: number
          pet_id: string
        }
        Insert: {
          data_leitura?: string
          endereco?: string | null
          id?: string
          latitude: number
          longitude: number
          pet_id: string
        }
        Update: {
          data_leitura?: string
          endereco?: string | null
          id?: string
          latitude?: number
          longitude?: number
          pet_id?: string
        }
        Relationships: []
      }
      pet_resumos_ia: {
        Row: {
          alertas: Json | null
          created_at: string
          id: string
          pet_id: string
          recomendacoes: Json | null
          resumo: string
          score_saude: string
        }
        Insert: {
          alertas?: Json | null
          created_at?: string
          id?: string
          pet_id: string
          recomendacoes?: Json | null
          resumo: string
          score_saude?: string
        }
        Update: {
          alertas?: Json | null
          created_at?: string
          id?: string
          pet_id?: string
          recomendacoes?: Json | null
          resumo?: string
          score_saude?: string
        }
        Relationships: []
      }
      pet_veterinarians: {
        Row: {
          access_level: string
          authorized_at: string | null
          authorized_by: string | null
          created_at: string
          id: string
          pet_id: string
          requested_at: string
          revoked_at: string | null
          status: string
          veterinarian_id: string
        }
        Insert: {
          access_level?: string
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          id?: string
          pet_id: string
          requested_at?: string
          revoked_at?: string | null
          status?: string
          veterinarian_id: string
        }
        Update: {
          access_level?: string
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string
          id?: string
          pet_id?: string
          requested_at?: string
          revoked_at?: string | null
          status?: string
          veterinarian_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_veterinarians_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_veterinarians_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          data_criacao: string
          data_nascimento: string | null
          data_perdido: string | null
          endereco: string | null
          especie: string | null
          foto_url: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso: number | null
          raca: string | null
          sexo: string | null
          status_ativado: boolean
          status_perdido: boolean
          tag_id: string | null
          telefone: string
          token: string | null
          tutor_id: string | null
          ultima_latitude: number | null
          ultima_leitura: string | null
          ultima_localizacao: string | null
          ultima_longitude: number | null
          ultimo_acesso: string | null
          ultimo_horario: string | null
          ultimo_local: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          data_criacao?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          especie?: string | null
          foto_url?: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso?: number | null
          raca?: string | null
          sexo?: string | null
          status_ativado?: boolean
          status_perdido?: boolean
          tag_id?: string | null
          telefone: string
          token?: string | null
          tutor_id?: string | null
          ultima_latitude?: number | null
          ultima_leitura?: string | null
          ultima_localizacao?: string | null
          ultima_longitude?: number | null
          ultimo_acesso?: string | null
          ultimo_horario?: string | null
          ultimo_local?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          data_criacao?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          especie?: string | null
          foto_url?: string | null
          id?: string
          nome_dono?: string
          nome_pet?: string
          peso?: number | null
          raca?: string | null
          sexo?: string | null
          status_ativado?: boolean
          status_perdido?: boolean
          tag_id?: string | null
          telefone?: string
          token?: string | null
          tutor_id?: string | null
          ultima_latitude?: number | null
          ultima_leitura?: string | null
          ultima_localizacao?: string | null
          ultima_longitude?: number | null
          ultimo_acesso?: string | null
          ultimo_horario?: string | null
          ultimo_local?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_clinicos: {
        Row: {
          atendimento_id: string | null
          created_at: string
          dados_json: Json | null
          descricao: string | null
          id: string
          pet_id: string
          tipo: string
          titulo: string
          veterinarian_id: string | null
        }
        Insert: {
          atendimento_id?: string | null
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id: string
          tipo?: string
          titulo: string
          veterinarian_id?: string | null
        }
        Update: {
          atendimento_id?: string | null
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id?: string
          tipo?: string
          titulo?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_clinicos_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos_veterinarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_clinicos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_clinicos_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_solicitacoes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          observacoes: string | null
          pet_id: string
          status: string
          tag_uid: string | null
          tutor_id: string | null
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          pet_id: string
          status?: string
          tag_uid?: string | null
          tutor_id?: string | null
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          pet_id?: string
          status?: string
          tag_uid?: string | null
          tutor_id?: string | null
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_solicitacoes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_solicitacoes_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_solicitacoes_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          activated_at: string | null
          created_at: string
          deactivated_at: string | null
          id: string
          pet_id: string | null
          status: string
          uid_publico: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          pet_id?: string | null
          status?: string
          uid_publico: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          pet_id?: string | null
          status?: string
          uid_publico?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      tutores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacinas: {
        Row: {
          created_at: string
          created_by_role: string
          created_by_user: string | null
          data_aplicacao: string
          id: string
          nome_vacina: string
          observacoes: string | null
          pet_id: string
          proxima_dose: string | null
          tipo: string
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_aplicacao: string
          id?: string
          nome_vacina: string
          observacoes?: string | null
          pet_id: string
          proxima_dose?: string | null
          tipo?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_role?: string
          created_by_user?: string | null
          data_aplicacao?: string
          id?: string
          nome_vacina?: string
          observacoes?: string | null
          pet_id?: string
          proxima_dose?: string | null
          tipo?: string
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacinas_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarios"
            referencedColumns: ["id"]
          },
        ]
      }
      veterinarios: {
        Row: {
          ativo: boolean
          clinica: string | null
          created_at: string
          crmv: string | null
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          senha_hash: string | null
          status_profissional: string
          telefone: string | null
          uf_crmv: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica?: string | null
          created_at?: string
          crmv?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          senha_hash?: string | null
          status_profissional?: string
          telefone?: string | null
          uf_crmv?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica?: string | null
          created_at?: string
          crmv?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          senha_hash?: string | null
          status_profissional?: string
          telefone?: string | null
          uf_crmv?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_conceder_papel: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      admin_create: {
        Args: { p_email: string; p_nome: string; p_senha: string }
        Returns: string
      }
      admin_listar_usuarios: {
        Args: never
        Returns: {
          admin_ativo: boolean
          chave: string
          clinica: string
          conta_vinculada: boolean
          criado_em: string
          crmv: string
          email: string
          nome: string
          pacientes_count: number
          papeis: string[]
          pets_count: number
          status: string
          status_profissional: string
          tags_count: number
          tutor_id: string
          uf_crmv: string
          user_id: string
          veterinario_id: string
        }[]
      }
      admin_login: {
        Args: { p_email: string; p_senha_hash: string }
        Returns: {
          ativo: boolean
          email: string
          id: string
          nome: string
        }[]
      }
      admin_preparar_tag: {
        Args: { p_pet_id: string; p_solicitacao?: string; p_uid: string }
        Returns: string
      }
      admin_revogar_papel: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      admin_set_password: {
        Args: { p_id: string; p_senha: string }
        Returns: undefined
      }
      ativar_pet_com_token: {
        Args: {
          p_data_nascimento?: string
          p_endereco?: string
          p_foto_url?: string
          p_id: string
          p_nome_dono: string
          p_nome_pet: string
          p_peso?: number
          p_telefone: string
          p_token: string
        }
        Returns: string
      }
      ativar_tag_para_pet: {
        Args: { p_token: string; p_uid: string }
        Returns: string
      }
      concluir_cadastro_veterinario: {
        Args: {
          p_clinica?: string
          p_crmv?: string
          p_especialidade?: string
          p_nome: string
          p_telefone?: string
          p_uf_crmv?: string
        }
        Returns: string
      }
      criar_perfil_veterinario: {
        Args: {
          p_clinica?: string
          p_crmv?: string
          p_email: string
          p_especialidade?: string
          p_nome: string
          p_telefone?: string
          p_uf_crmv?: string
        }
        Returns: string
      }
      e_meu_pet: { Args: { p_pet_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      meu_tutor_id: { Args: never; Returns: string }
      meu_vet_id: { Args: never; Returns: string }
      pet_publico: {
        Args: { p_id: string }
        Returns: {
          cor: string
          especie: string
          foto_url: string
          id: string
          nome_dono: string
          nome_pet: string
          raca: string
          sexo: string
          status_perdido: boolean
          telefone: string
          ultima_latitude: number
          ultima_longitude: number
          ultimo_horario: string
        }[]
      }
      pet_status_ativacao: {
        Args: { p_id: string }
        Returns: {
          ativado: boolean
          existe: boolean
        }[]
      }
      pode_ver_clinico: { Args: { p_pet_id: string }; Returns: boolean }
      recalc_app_metrics: { Args: never; Returns: undefined }
      registrar_leitura_publica: {
        Args: {
          p_endereco?: string
          p_id: string
          p_lat: number
          p_lng: number
        }
        Returns: boolean
      }
      reivindicar_admin: {
        Args: { p_email: string; p_senha: string }
        Returns: boolean
      }
      reivindicar_pet: {
        Args: { p_id: string; p_token: string }
        Returns: boolean
      }
      resolver_tag_publica: { Args: { p_uid: string }; Returns: string }
      vet_buscar_pet_por_tag: {
        Args: { p_uid: string }
        Returns: {
          especie: string
          foto_url: string
          nome_pet: string
          pet_id: string
          raca: string
          sexo: string
          tag_uid: string
          tutor_nome: string
          vinculo_status: string
        }[]
      }
      vet_criar_paciente: {
        Args: {
          p_data_nascimento?: string
          p_especie?: string
          p_nome_pet: string
          p_observacoes?: string
          p_peso?: number
          p_raca?: string
          p_sexo?: string
          p_tutor_email?: string
          p_tutor_nome?: string
          p_tutor_telefone?: string
        }
        Returns: string
      }
      vet_tem_acesso: { Args: { p_pet_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "tutor" | "veterinarian" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["tutor", "veterinarian", "admin"],
    },
  },
} as const
