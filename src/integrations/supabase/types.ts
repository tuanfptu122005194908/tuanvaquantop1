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
      answers: {
        Row: {
          content: string | null
          created_at: string
          id: number
          is_correct: boolean
          label: string
          question_id: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          is_correct?: boolean
          label: string
          question_id: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          is_correct?: boolean
          label?: string
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          answer_id: number | null
          attempt_id: number
          id: number
          is_correct: boolean | null
          question_id: number
        }
        Insert: {
          answer_id?: number | null
          attempt_id: number
          id?: number
          is_correct?: boolean | null
          question_id: number
        }
        Update: {
          answer_id?: number | null
          attempt_id?: number
          id?: number
          is_correct?: boolean | null
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          correct_count: number | null
          exam_id: number
          id: number
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          correct_count?: number | null
          exam_id: number
          id?: number
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          correct_count?: number | null
          exam_id?: number
          id?: number
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          order_index: number
          subject_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          order_index?: number
          subject_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          order_index?: number
          subject_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: number
          is_active: boolean
          max_uses: number | null
          min_order_amount: number
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: number
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: number
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          order_id: number
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: number
          order_id: number
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: number
          order_id?: number
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          category_id: number | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          file_upload: string | null
          id: number
          is_published: boolean
          subject_id: number
          theory_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_upload?: string | null
          id?: number
          is_published?: boolean
          subject_id: number
          theory_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_upload?: string | null
          id?: number
          is_published?: boolean
          subject_id?: number
          theory_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: number
          order_id: number
          plan_id: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: number
          order_id: number
          plan_id: number
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: number
          plan_id?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          discount_amount: number
          full_name: string | null
          id: number
          note: string | null
          payment_proof: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string | null
          subject_id: number | null
          subject_name: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          discount_amount?: number
          full_name?: string | null
          id?: number
          note?: string | null
          payment_proof?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          subject_id?: number | null
          subject_name?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          discount_amount?: number
          full_name?: string | null
          id?: number
          note?: string | null
          payment_proof?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          subject_id?: number | null
          subject_name?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          id: number
          note: string | null
          qr_image_url: string | null
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          id?: number
          note?: string | null
          qr_image_url?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          id?: number
          note?: string | null
          qr_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: number
          is_active: boolean
          name: string
          price: number
          subject_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: number
          is_active?: boolean
          name: string
          price: number
          subject_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: number
          is_active?: boolean
          name?: string
          price?: number
          subject_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          exam_id: number
          id: number
          image_url: string | null
          order_index: number
          question_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: number
          id?: number
          image_url?: string | null
          order_index?: number
          question_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: number
          id?: number
          image_url?: string | null
          order_index?: number
          question_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          order_index: number
          price: number
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          order_index?: number
          price?: number
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number
          thumbnail?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      theory_content: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_published: boolean
          order_index: number
          subject_id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_published?: boolean
          order_index?: number
          subject_id: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_published?: boolean
          order_index?: number
          subject_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_content_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_exams: {
        Row: {
          content_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          exam_id: number | null
          file_url: string | null
          id: number
          image_urls: string[] | null
          link_url: string | null
          subject_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_id?: number | null
          file_url?: string | null
          id?: never
          image_urls?: string[] | null
          link_url?: string | null
          subject_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_id?: number | null
          file_url?: string | null
          id?: never
          image_urls?: string[] | null
          link_url?: string | null
          subject_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theory_exams_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_items: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: number
          order_index: number
          theory_id: number
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: number
          order_index?: number
          theory_id: number
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: number
          order_index?: number
          theory_id?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_items_theory_id_fkey"
            columns: ["theory_id"]
            isOneToOne: false
            referencedRelation: "theory_content"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_sections: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: number
          is_published: boolean
          order_index: number
          subject_id: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          is_published?: boolean
          order_index?: number
          subject_id: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          is_published?: boolean
          order_index?: number
          subject_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theory_sections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_sections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: number
          subject_id: number
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: number
          subject_id: number
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: number
          subject_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: number
          order_id: number | null
          start_date: string
          subject_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          order_id?: number | null
          start_date?: string
          subject_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          order_id?: number | null
          start_date?: string
          subject_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          phone: string | null
          role: string
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_pending_notifications: { Args: never; Returns: number }
      get_notification_history: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string
          error_message: string
          id: number
          order_data: Json
          order_id: number
          sent_at: string
          status: string
          updated_at: string
        }[]
      }
      has_subject_access: {
        Args: { _subject_id: number; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      process_pending_notifications: {
        Args: never
        Returns: {
          message: string
          notification_id: number
          order_id: number
          status: string
        }[]
      }
      retry_failed_notification: {
        Args: { notification_id_param: number }
        Returns: Json
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
