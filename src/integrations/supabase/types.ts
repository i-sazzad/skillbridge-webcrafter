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
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["coach_msg_role"]
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["coach_msg_role"]
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["coach_msg_role"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          proficiency_taught: number
          skill_id: string
        }
        Insert: {
          course_id: string
          proficiency_taught?: number
          skill_id: string
        }
        Update: {
          course_id?: string
          proficiency_taught?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          credits: number
          id: string
          program_id: string
          title: string
        }
        Insert: {
          credits?: number
          id?: string
          program_id: string
          title: string
        }
        Update: {
          credits?: number
          id?: string
          program_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          district: string
          id: string
          name: string
          profile_id: string | null
          sector: string
        }
        Insert: {
          district: string
          id?: string
          name: string
          profile_id?: string | null
          sector: string
        }
        Update: {
          district?: string
          id?: string
          name?: string
          profile_id?: string | null
          sector?: string
        }
        Relationships: [
          {
            foreignKeyName: "employers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      graduate_outcomes: {
        Row: {
          grad_year: number
          id: string
          program_id: string
          salary_band: string | null
          sector: string | null
          status: Database["public"]["Enums"]["outcome_status"]
          time_to_hire_days: number | null
        }
        Insert: {
          grad_year: number
          id?: string
          program_id: string
          salary_band?: string | null
          sector?: string | null
          status: Database["public"]["Enums"]["outcome_status"]
          time_to_hire_days?: number | null
        }
        Update: {
          grad_year?: number
          id?: string
          program_id?: string
          salary_band?: string | null
          sector?: string | null
          status?: Database["public"]["Enums"]["outcome_status"]
          time_to_hire_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graduate_outcomes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          district: string
          id: string
          name: string
          type: string
        }
        Insert: {
          district: string
          id?: string
          name: string
          type: string
        }
        Update: {
          district?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      job_roles: {
        Row: {
          id: string
          sector: string
          title: string
        }
        Insert: {
          id?: string
          sector: string
          title: string
        }
        Update: {
          id?: string
          sector?: string
          title?: string
        }
        Relationships: []
      }
      learning_plans: {
        Row: {
          created_at: string
          id: string
          skill_id: string
          status: Database["public"]["Enums"]["plan_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_plans_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_skills: {
        Row: {
          listing_id: string
          required_proficiency: number
          skill_id: string
        }
        Insert: {
          listing_id: string
          required_proficiency?: number
          skill_id: string
        }
        Update: {
          listing_id?: string
          required_proficiency?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_skills_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          created_at: string
          district: string
          employer_id: string
          id: string
          openings: number
          role_id: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
        }
        Insert: {
          created_at?: string
          district: string
          employer_id: string
          id?: string
          openings?: number
          role_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
        }
        Update: {
          created_at?: string
          district?: string
          employer_id?: string
          id?: string
          openings?: number
          role_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          institution_id: string
          level: string
          name: string
        }
        Insert: {
          id?: string
          institution_id: string
          level: string
          name: string
        }
        Update: {
          id?: string
          institution_id?: string
          level?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          evidence_count: number
          id: string
          program_id: string
          rationale: string
          skill_id: string
          status: string
        }
        Insert: {
          evidence_count?: number
          id?: string
          program_id: string
          rationale: string
          skill_id: string
          status?: string
        }
        Update: {
          evidence_count?: number
          id?: string
          program_id?: string
          rationale?: string
          skill_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skills: {
        Row: {
          required_proficiency: number
          role_id: string
          skill_id: string
          weight: number
        }
        Insert: {
          required_proficiency?: number
          role_id: string
          skill_id: string
          weight?: number
        }
        Update: {
          required_proficiency?: number
          role_id?: string
          skill_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          avg_salary_max: number | null
          avg_salary_min: number | null
          category: string
          demand_index: number
          id: string
          name: string
          trend: Database["public"]["Enums"]["skill_trend"]
        }
        Insert: {
          avg_salary_max?: number | null
          avg_salary_min?: number | null
          category: string
          demand_index?: number
          id?: string
          name: string
          trend?: Database["public"]["Enums"]["skill_trend"]
        }
        Update: {
          avg_salary_max?: number | null
          avg_salary_min?: number | null
          category?: string
          demand_index?: number
          id?: string
          name?: string
          trend?: Database["public"]["Enums"]["skill_trend"]
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          grad_year: number | null
          id: string
          profile_id: string | null
          program_id: string | null
          target_role_id: string | null
        }
        Insert: {
          grad_year?: number | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          target_role_id?: string | null
        }
        Update: {
          grad_year?: number | null
          id?: string
          profile_id?: string | null
          program_id?: string | null
          target_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          proficiency: number
          skill_id: string
          student_id: string
        }
        Insert: {
          proficiency: number
          skill_id: string
          student_id: string
        }
        Update: {
          proficiency?: number
          skill_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "institution" | "employer" | "admin"
      coach_msg_role: "user" | "assistant" | "system"
      listing_status: "active" | "closed" | "draft"
      outcome_status: "employed" | "unemployed" | "further_study" | "freelance"
      plan_status: "planned" | "in_progress" | "done"
      skill_trend: "rising" | "stable" | "declining"
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
      app_role: ["student", "institution", "employer", "admin"],
      coach_msg_role: ["user", "assistant", "system"],
      listing_status: ["active", "closed", "draft"],
      outcome_status: ["employed", "unemployed", "further_study", "freelance"],
      plan_status: ["planned", "in_progress", "done"],
      skill_trend: ["rising", "stable", "declining"],
    },
  },
} as const
