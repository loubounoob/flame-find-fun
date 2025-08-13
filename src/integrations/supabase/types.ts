export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          archived_at: string | null
          booking_date: string
          booking_time: string | null
          business_user_id: string
          created_at: string
          id: string
          is_archived: boolean | null
          notes: string | null
          offer_id: string
          participant_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          booking_date?: string
          booking_time?: string | null
          business_user_id: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          offer_id: string
          participant_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          booking_date?: string
          booking_time?: string | null
          business_user_id?: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          offer_id?: string
          participant_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_addresses: {
        Row: {
          address_name: string
          business_user_id: string
          created_at: string
          full_address: string
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string
        }
        Insert: {
          address_name: string
          business_user_id: string
          created_at?: string
          full_address: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Update: {
          address_name?: string
          business_user_id?: string
          created_at?: string
          full_address?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      business_media: {
        Row: {
          business_user_id: string
          created_at: string
          description: string | null
          id: string
          media_type: string
          media_url: string
          updated_at: string
        }
        Insert: {
          business_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          media_url: string
          updated_at?: string
        }
        Update: {
          business_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_pricing: {
        Row: {
          business_user_id: string
          created_at: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          min_participants: number | null
          price_amount: number
          price_type: string
          service_name: string
          special_conditions: string | null
          updated_at: string
        }
        Insert: {
          business_user_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          min_participants?: number | null
          price_amount: number
          price_type: string
          service_name: string
          special_conditions?: string | null
          updated_at?: string
        }
        Update: {
          business_user_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          min_participants?: number | null
          price_amount?: number
          price_type?: string
          service_name?: string
          special_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flames: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flames_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          offer_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_views: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          address: string | null
          business_user_id: string
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          max_participants: number | null
          price: string | null
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address?: string | null
          business_user_id: string
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_participants?: number | null
          price?: string | null
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address?: string | null
          business_user_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_participants?: number | null
          price?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          address: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_name: string | null
          business_type: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          opening_hours: string | null
          phone: string | null
          study_level: string | null
          university: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          opening_hours?: string | null
          phone?: string | null
          study_level?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          opening_hours?: string | null
          phone?: string | null
          study_level?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_flames_daily: {
        Row: {
          created_at: string
          flame_date: string
          id: string
          offer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flame_date?: string
          id?: string
          offer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flame_date?: string
          id?: string
          offer_id?: string | null
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
      archive_old_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_mark_old_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_rating_notification: {
        Args: { booking_id: string; user_id: string; offer_id: string }
        Returns: undefined
      }
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
