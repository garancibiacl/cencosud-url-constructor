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
      access_logs: {
        Row: {
          created_at: string
          email: string
          event_type: string
          id: string
          module_label: string | null
          module_path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_type: string
          id?: string
          module_label?: string | null
          module_path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          module_label?: string | null
          module_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_generation_jobs: {
        Row: {
          block_type: string
          brand: string | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          fal_request_id: string | null
          id: string
          prompt: string | null
          quality: string
          sku: string | null
          status: string
          style: string
          user_id: string
        }
        Insert: {
          block_type: string
          brand?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          fal_request_id?: string | null
          id?: string
          prompt?: string | null
          quality?: string
          sku?: string | null
          status?: string
          style?: string
          user_id: string
        }
        Update: {
          block_type?: string
          brand?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          fal_request_id?: string | null
          id?: string
          prompt?: string | null
          quality?: string
          sku?: string | null
          status?: string
          style?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_images: {
        Row: {
          created_at: string
          file_size_bytes: number | null
          height: number | null
          id: string
          is_selected: boolean
          job_id: string
          metadata: Json
          model: string | null
          prompt: string | null
          public_url: string
          seed: number | null
          storage_path: string
          user_id: string
          variant_index: number
          width: number | null
        }
        Insert: {
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_selected?: boolean
          job_id: string
          metadata?: Json
          model?: string | null
          prompt?: string | null
          public_url: string
          seed?: number | null
          storage_path: string
          user_id: string
          variant_index?: number
          width?: number | null
        }
        Update: {
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_selected?: boolean
          job_id?: string
          metadata?: Json
          model?: string | null
          prompt?: string | null
          public_url?: string
          seed?: number | null
          storage_path?: string
          user_id?: string
          variant_index?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          description: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          slug: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          slug: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          slug?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hidden_catalog_prompts: {
        Row: {
          catalog_id: string
          hidden_at: string
          hidden_by: string | null
        }
        Insert: {
          catalog_id: string
          hidden_at?: string
          hidden_by?: string | null
        }
        Update: {
          catalog_id?: string
          hidden_at?: string
          hidden_by?: string | null
        }
        Relationships: []
      }
      mailing_versions: {
        Row: {
          created_at: string
          id: string
          mailing_id: string
          note: string | null
          snapshot: Json
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          mailing_id: string
          note?: string | null
          snapshot: Json
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          id?: string
          mailing_id?: string
          note?: string | null
          snapshot?: Json
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "mailing_versions_mailing_id_fkey"
            columns: ["mailing_id"]
            isOneToOne: false
            referencedRelation: "mailings"
            referencedColumns: ["id"]
          },
        ]
      }
      mailings: {
        Row: {
          created_at: string
          current_version: number
          document: Json
          id: string
          name: string
          preheader: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version?: number
          document?: Json
          id?: string
          name?: string
          preheader?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version?: number
          document?: Json
          id?: string
          name?: string
          preheader?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          attributes: Json
          brand: string
          category: string | null
          description: string | null
          discount: number | null
          fetched_at: string
          id: string
          image_url: string | null
          name: string
          original_price: number | null
          price: number | null
          raw_payload: Json
          sku: string
          subcategory: string | null
        }
        Insert: {
          attributes?: Json
          brand: string
          category?: string | null
          description?: string | null
          discount?: number | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          name: string
          original_price?: number | null
          price?: number | null
          raw_payload?: Json
          sku: string
          subcategory?: string | null
        }
        Update: {
          attributes?: Json
          brand?: string
          category?: string | null
          description?: string | null
          discount?: number | null
          fetched_at?: string
          id?: string
          image_url?: string | null
          name?: string
          original_price?: number | null
          price?: number | null
          raw_payload?: Json
          sku?: string
          subcategory?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      prompts: {
        Row: {
          brand: string
          category: string
          content: string
          created_at: string
          created_by: string | null
          created_by_id: string | null
          description: string
          id: string
          model: string | null
          tags: string[]
          title: string
          tone: string
          updated_at: string | null
          updated_by: string | null
          updated_by_id: string | null
          variables: string[] | null
        }
        Insert: {
          brand: string
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description?: string
          id: string
          model?: string | null
          tags?: string[]
          title: string
          tone: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_id?: string | null
          variables?: string[] | null
        }
        Update: {
          brand?: string
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description?: string
          id?: string
          model?: string | null
          tags?: string[]
          title?: string
          tone?: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_id?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          app: string
          code: string
          description: string
          filename: string
          id: string
          prompt: string
          tags: string[]
          title: string
          updated_at: string | null
          updated_by: string | null
          updated_by_id: string | null
          uploaded_at: string
          uploaded_by: string | null
          uploaded_by_id: string | null
        }
        Insert: {
          app?: string
          code: string
          description?: string
          filename: string
          id: string
          prompt?: string
          tags?: string[]
          title: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_by_id?: string | null
        }
        Update: {
          app?: string
          code?: string
          description?: string
          filename?: string
          id?: string
          prompt?: string
          tags?: string[]
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_by_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_rate_limit_ok: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "disenador"
        | "programador"
        | "director"
        | "cencosud"
        | "mailing"
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
      app_role: [
        "admin",
        "disenador",
        "programador",
        "director",
        "cencosud",
        "mailing",
      ],
    },
  },
} as const
