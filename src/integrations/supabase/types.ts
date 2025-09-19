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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          transaction_reference: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_reference: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_reference?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_packages: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration_days: number
          features: string[] | null
          id: string
          minimum_amount: number
          multiplier: number
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: string[] | null
          id?: string
          minimum_amount: number
          multiplier?: number
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: string[] | null
          id?: string
          minimum_amount?: number
          multiplier?: number
          name?: string
          package_type?: Database["public"]["Enums"]["package_type"]
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          expected_return: number
          id: string
          package_id: string
          profit_distributed: number
          start_date: string
          status: Database["public"]["Enums"]["investment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date?: string | null
          expected_return: number
          id?: string
          package_id: string
          profit_distributed?: number
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          expected_return?: number
          id?: string
          package_id?: string
          profit_distributed?: number
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "investment_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          experience_level: string | null
          full_name: string
          how_heard_about: string | null
          id: string
          phone: string
          referral_code: string
          referred_by: string | null
          terms_accepted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          experience_level?: string | null
          full_name: string
          how_heard_about?: string | null
          id?: string
          phone: string
          referral_code: string
          referred_by?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          experience_level?: string | null
          full_name?: string
          how_heard_about?: string | null
          id?: string
          phone?: string
          referral_code?: string
          referred_by?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          total_deposits: number
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          total_deposits?: number
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          total_deposits?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          id: string
          main_balance: number
          referral_bonus_balance: number
          total_invested: number
          total_profits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          main_balance?: number
          referral_bonus_balance?: number
          total_invested?: number
          total_profits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          main_balance?: number
          referral_bonus_balance?: number
          total_invested?: number
          total_profits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          phone_number: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          phone_number: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          phone_number?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
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
      deposit_status: "pending" | "confirmed" | "rejected"
      investment_status: "active" | "pending" | "completed" | "cancelled"
      package_type: "lite" | "pro" | "elite"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "investment"
        | "profit"
        | "referral_commission"
        | "referral_bonus_transfer"
      withdrawal_status: "pending" | "approved" | "rejected"
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
    Enums: {
      deposit_status: ["pending", "confirmed", "rejected"],
      investment_status: ["active", "pending", "completed", "cancelled"],
      package_type: ["lite", "pro", "elite"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "investment",
        "profit",
        "referral_commission",
        "referral_bonus_transfer",
      ],
      withdrawal_status: ["pending", "approved", "rejected"],
    },
  },
} as const
