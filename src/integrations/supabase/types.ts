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
      pets: {
        Row: {
          ativo: boolean
          created_at: string
          data_nascimento: string | null
          data_perdido: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso: number | null
          status_perdido: boolean
          telefone: string
          ultimo_horario: string | null
          ultimo_local: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          foto_url?: string | null
          id: string
          nome_dono: string
          nome_pet: string
          peso?: number | null
          status_perdido?: boolean
          telefone: string
          ultimo_horario?: string | null
          ultimo_local?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_nascimento?: string | null
          data_perdido?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          nome_dono?: string
          nome_pet?: string
          peso?: number | null
          status_perdido?: boolean
          telefone?: string
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
      [_ in never]: never
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
