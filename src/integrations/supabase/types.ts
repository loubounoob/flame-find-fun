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
          total_price: number | null
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
          total_price?: number | null
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
          total_price?: number | null
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
      business_earnings: {
        Row: {
          amount: number
          booking_id: string | null
          business_user_id: string
          created_at: string
          description: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          business_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          business_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_finances: {
        Row: {
          available_balance: number | null
          business_user_id: string
          created_at: string
          id: string
          total_boost_spent: number | null
          total_earnings: number | null
          total_withdrawn: number | null
          updated_at: string
        }
        Insert: {
          available_balance?: number | null
          business_user_id: string
          created_at?: string
          id?: string
          total_boost_spent?: number | null
          total_earnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string
        }
        Update: {
          available_balance?: number | null
          business_user_id?: string
          created_at?: string
          id?: string
          total_boost_spent?: number | null
          total_earnings?: number | null
          total_withdrawn?: number | null
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
      business_pricing_rules: {
        Row: {
          business_user_id: string
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          is_percentage: boolean
          offer_id: string | null
          price_modifier: number
          priority: number | null
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          business_user_id: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          offer_id?: string | null
          price_modifier?: number
          priority?: number | null
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          business_user_id?: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          offer_id?: string | null
          price_modifier?: number
          priority?: number | null
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_ratings: {
        Row: {
          average_rating: number
          business_user_id: string
          created_at: string
          id: string
          total_rating: number
          total_reviews: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          business_user_id: string
          created_at?: string
          id?: string
          total_rating?: number
          total_reviews?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          business_user_id?: string
          created_at?: string
          id?: string
          total_rating?: number
          total_reviews?: number
          updated_at?: string
        }
        Relationships: []
      }
      business_revenue_stats: {
        Row: {
          average_booking_value: number | null
          booking_count: number | null
          business_user_id: string
          created_at: string
          daily_revenue: number | null
          id: string
          stat_date: string
          top_offer_id: string | null
          updated_at: string
        }
        Insert: {
          average_booking_value?: number | null
          booking_count?: number | null
          business_user_id: string
          created_at?: string
          daily_revenue?: number | null
          id?: string
          stat_date?: string
          top_offer_id?: string | null
          updated_at?: string
        }
        Update: {
          average_booking_value?: number | null
          booking_count?: number | null
          business_user_id?: string
          created_at?: string
          daily_revenue?: number | null
          id?: string
          stat_date?: string
          top_offer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_rate_limits: {
        Row: {
          business_user_id: string
          created_at: string | null
          id: string
          operation_count: number | null
          operation_type: string
          window_start: string | null
        }
        Insert: {
          business_user_id: string
          created_at?: string | null
          id?: string
          operation_count?: number | null
          operation_type: string
          window_start?: string | null
        }
        Update: {
          business_user_id?: string
          created_at?: string | null
          id?: string
          operation_count?: number | null
          operation_type?: string
          window_start?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          business_user_id: string
          created_at: string
          description: string | null
          id: string
          stripe_payment_intent_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          business_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          business_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          transaction_type?: string
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
      offer_boosts: {
        Row: {
          amount_paid: number
          boost_score: number | null
          boost_type: string
          business_user_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          offer_id: string
          start_date: string
        }
        Insert: {
          amount_paid: number
          boost_score?: number | null
          boost_type: string
          business_user_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          offer_id: string
          start_date?: string
        }
        Update: {
          amount_paid?: number
          boost_score?: number | null
          boost_type?: string
          business_user_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          offer_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_offer_boosts_offer"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_pricing_options: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_default: boolean | null
          offer_id: string
          option_name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_default?: boolean | null
          offer_id: string
          option_name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_default?: boolean | null
          offer_id?: string
          option_name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_offer_pricing_options_offer"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
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
          base_price: number | null
          business_user_id: string
          category: string
          created_at: string
          description: string
          has_promotion: boolean | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          max_participants: number | null
          price: string | null
          pricing_options: Json | null
          requires_images: boolean | null
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address?: string | null
          base_price?: number | null
          business_user_id: string
          category: string
          created_at?: string
          description: string
          has_promotion?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_participants?: number | null
          price?: string | null
          pricing_options?: Json | null
          requires_images?: boolean | null
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address?: string | null
          base_price?: number | null
          business_user_id?: string
          category?: string
          created_at?: string
          description?: string
          has_promotion?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_participants?: number | null
          price?: string | null
          pricing_options?: Json | null
          requires_images?: boolean | null
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
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_onboarding_completed: boolean | null
          stripe_connect_payouts_enabled: boolean | null
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
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_onboarding_completed?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
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
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_onboarding_completed?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          study_level?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          business_user_id: string
          created_at: string
          description: string | null
          discount_text: string
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean
          max_participants: number | null
          offer_id: string
          original_price: number
          promotional_price: number
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          business_user_id: string
          created_at?: string
          description?: string | null
          discount_text: string
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          offer_id: string
          original_price: number
          promotional_price: number
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          business_user_id?: string
          created_at?: string
          description?: string | null
          discount_text?: string
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          max_participants?: number | null
          offer_id?: string
          original_price?: number
          promotional_price?: number
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          business_amount: number
          business_user_id: string
          created_at: string
          customer_user_id: string
          id: string
          platform_fee: number
          status: string
          stripe_fee: number
          stripe_payment_intent_id: string
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          business_amount: number
          business_user_id: string
          created_at?: string
          customer_user_id: string
          id?: string
          platform_fee?: number
          status?: string
          stripe_fee?: number
          stripe_payment_intent_id: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          business_amount?: number
          business_user_id?: string
          created_at?: string
          customer_user_id?: string
          id?: string
          platform_fee?: number
          status?: string
          stripe_fee?: number
          stripe_payment_intent_id?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      withdrawal_requests: {
        Row: {
          amount: number
          business_user_id: string
          created_at: string
          id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          business_user_id: string
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          business_user_id?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
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
      calculate_booking_price: {
        Args: {
          p_booking_date: string
          p_booking_time: string
          p_business_user_id: string
          p_offer_id: string
          p_participant_count: number
        }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_business_user_id: string
          p_max_operations?: number
          p_operation_type: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_offer_rating_stats: {
        Args: { offer_id_param: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      schedule_rating_notification: {
        Args: { booking_id: string; offer_id: string; user_id: string }
        Returns: undefined
      }
      secure_add_earning: {
        Args: {
          p_amount: number
          p_booking_id: string
          p_business_user_id: string
          p_description: string
        }
        Returns: boolean
      }
      secure_pay_for_boost: {
        Args: {
          p_amount: number
          p_boost_type: string
          p_business_user_id: string
          p_duration: number
          p_offer_id: string
        }
        Returns: boolean
      }
      secure_request_withdrawal: {
        Args: { p_amount: number; p_business_user_id: string }
        Returns: boolean
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
