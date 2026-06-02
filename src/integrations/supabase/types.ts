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
          senha_hash: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          senha_hash: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          senha_hash?: string
          updated_at?: string
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
      exames: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_exame: string | null
          id: string
          nome_exame: string
          observacoes: string | null
          pet_id: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_exame?: string | null
          id?: string
          nome_exame: string
          observacoes?: string | null
          pet_id: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_exame?: string | null
          id?: string
          nome_exame?: string
          observacoes?: string | null
          pet_id?: string
          updated_at?: string
        }
        Relationships: []
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
        }
        Insert: {
          created_at?: string
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
        }
        Update: {
          created_at?: string
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
        }
        Relationships: []
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
          dados_json: Json | null
          descricao: string | null
          id: string
          pet_id: string
          tipo_evento: string
          titulo: string
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id: string
          tipo_evento: string
          titulo: string
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          pet_id?: string
          tipo_evento?: string
          titulo?: string
        }
        Relationships: []
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
      pets: {
        Row: {
          ativo: boolean
          created_at: string
          data_criacao: string
          data_nascimento: string | null
          data_perdido: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso: number | null
          status_ativado: boolean
          status_perdido: boolean
          telefone: string
          token: string | null
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
          created_at?: string
          data_criacao?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          foto_url?: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso?: number | null
          status_ativado?: boolean
          status_perdido?: boolean
          telefone: string
          token?: string | null
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
          created_at?: string
          data_criacao?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome_dono?: string
          nome_pet?: string
          peso?: number | null
          status_ativado?: boolean
          status_perdido?: boolean
          telefone?: string
          token?: string | null
          ultima_latitude?: number | null
          ultima_leitura?: string | null
          ultima_localizacao?: string | null
          ultima_longitude?: number | null
          ultimo_acesso?: string | null
          ultimo_horario?: string | null
          ultimo_local?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vacinas: {
        Row: {
          created_at: string
          data_aplicacao: string
          id: string
          nome_vacina: string
          observacoes: string | null
          pet_id: string
          proxima_dose: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_aplicacao: string
          id?: string
          nome_vacina: string
          observacoes?: string | null
          pet_id: string
          proxima_dose?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_aplicacao?: string
          id?: string
          nome_vacina?: string
          observacoes?: string | null
          pet_id?: string
          proxima_dose?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create: {
        Args: { p_email: string; p_nome: string; p_senha: string }
        Returns: string
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
      admin_set_password: {
        Args: { p_id: string; p_senha: string }
        Returns: undefined
      }
      recalc_app_metrics: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
