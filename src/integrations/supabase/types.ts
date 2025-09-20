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
      generation_progress: {
        Row: {
          error_message: string | null
          id: string
          progress_percentage: number | null
          project_id: string
          stage: string
          status: Database["public"]["Enums"]["generation_status"]
          timestamp: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          project_id: string
          stage: string
          status?: Database["public"]["Enums"]["generation_status"]
          timestamp?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          project_id?: string
          stage?: string
          status?: Database["public"]["Enums"]["generation_status"]
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "website_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_deployments: {
        Row: {
          created_at: string
          deployed_at: string | null
          deployment_url: string | null
          id: string
          platform: string | null
          project_id: string
          status: Database["public"]["Enums"]["deployment_status"]
        }
        Insert: {
          created_at?: string
          deployed_at?: string | null
          deployment_url?: string | null
          id?: string
          platform?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["deployment_status"]
        }
        Update: {
          created_at?: string
          deployed_at?: string | null
          deployment_url?: string | null
          id?: string
          platform?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["deployment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "website_deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "website_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_generated_data: {
        Row: {
          assets_urls: Json | null
          created_at: string
          css_content: string | null
          html_content: string | null
          id: string
          js_content: string | null
          metadata: Json | null
          project_id: string
          updated_at: string
        }
        Insert: {
          assets_urls?: Json | null
          created_at?: string
          css_content?: string | null
          html_content?: string | null
          id?: string
          js_content?: string | null
          metadata?: Json | null
          project_id: string
          updated_at?: string
        }
        Update: {
          assets_urls?: Json | null
          created_at?: string
          css_content?: string | null
          html_content?: string | null
          id?: string
          js_content?: string | null
          metadata?: Json | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_generated_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "website_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_page_drafts: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          metadata: Json | null
          page_type: string
          project_id: string
          version: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_type: string
          project_id: string
          version?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_type?: string
          project_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "website_page_drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "website_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_projects: {
        Row: {
          business_name: string
          business_type: string
          created_at: string
          description: string
          id: string
          location: string | null
          status: Database["public"]["Enums"]["generation_status"]
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          business_type: string
          created_at?: string
          description: string
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          business_type?: string
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          target_audience?: string | null
          updated_at?: string
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
      deployment_status: "pending" | "deploying" | "deployed" | "failed"
      generation_status: "pending" | "in_progress" | "completed" | "failed"
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
      deployment_status: ["pending", "deploying", "deployed", "failed"],
      generation_status: ["pending", "in_progress", "completed", "failed"],
    },
  },
} as const
