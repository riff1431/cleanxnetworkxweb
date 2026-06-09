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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          postal_code: string
          province: string
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          postal_code: string
          province: string
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          postal_code?: string
          province?: string
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address_id: string | null
          cleaner_id: string | null
          cleaner_name: string | null
          created_at: string
          customer_id: string
          duration_hours: number
          id: string
          scheduled_date: string
          scheduled_time: string
          service_price: number
          service_type: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          cleaner_id?: string | null
          cleaner_name?: string | null
          created_at?: string
          customer_id: string
          duration_hours?: number
          id?: string
          scheduled_date: string
          scheduled_time: string
          service_price: number
          service_type: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          cleaner_id?: string | null
          cleaner_name?: string | null
          created_at?: string
          customer_id?: string
          duration_hours?: number
          id?: string
          scheduled_date?: string
          scheduled_time?: string
          service_price?: number
          service_type?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_of_the_week: {
        Row: {
          cleaner_profile_id: string
          created_at: string
          id: string
          is_active: boolean
          note: string | null
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          cleaner_profile_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          cleaner_profile_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_of_the_week_cleaner_profile_id_fkey"
            columns: ["cleaner_profile_id"]
            isOneToOne: false
            referencedRelation: "cleaner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_profiles: {
        Row: {
          bio: string | null
          business_name: string
          created_at: string
          gallery_images: string[] | null
          hourly_rate: number
          id: string
          instant_booking: boolean
          is_active: boolean
          is_verified: boolean
          profile_image: string | null
          response_time: string | null
          service_areas: string[]
          services: string[]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          business_name: string
          created_at?: string
          gallery_images?: string[] | null
          hourly_rate?: number
          id?: string
          instant_booking?: boolean
          is_active?: boolean
          is_verified?: boolean
          profile_image?: string | null
          response_time?: string | null
          service_areas?: string[]
          services?: string[]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          business_name?: string
          created_at?: string
          gallery_images?: string[] | null
          hourly_rate?: number
          id?: string
          instant_booking?: boolean
          is_active?: boolean
          is_verified?: boolean
          profile_image?: string | null
          response_time?: string | null
          service_areas?: string[]
          services?: string[]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          cleaner_id: string | null
          commission_amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          net_amount: number
          notes: string | null
          paid_at: string | null
          service_date: string
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          cleaner_id?: string | null
          commission_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          service_date: string
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          cleaner_id?: string | null
          commission_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          service_date?: string
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_message: string | null
          created_at: string
          id: string
          job_id: string
          proposed_rate: number | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id?: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number
          budget_max: number | null
          budget_min: number | null
          created_at: string
          description: string
          duration_hours: number | null
          id: string
          image_url: string | null
          location: string
          preferred_date: string | null
          preferred_time: string | null
          service_type: string
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          applications_count?: number
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description: string
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          location: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_type?: string
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          applications_count?: number
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          location?: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          text: string
        }
        Insert: {
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          text: string
        }
        Update: {
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          booking_date: string
          booking_id: string | null
          booking_time: string
          cleaner_email: string | null
          cleaner_id: string | null
          cleaner_name: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_id: string
          customer_name: string
          id: string
          payment_method: string
          rejection_reason: string | null
          service_type: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          booking_date: string
          booking_id?: string | null
          booking_time: string
          cleaner_email?: string | null
          cleaner_id?: string | null
          cleaner_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email: string
          customer_id: string
          customer_name: string
          id?: string
          payment_method?: string
          rejection_reason?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          booking_date?: string
          booking_id?: string | null
          booking_time?: string
          cleaner_email?: string | null
          cleaner_id?: string | null
          cleaner_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string
          customer_id?: string
          customer_name?: string
          id?: string
          payment_method?: string
          rejection_reason?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          advance_booking_days: number
          allow_instant_booking: boolean
          auto_approve_cleaners: boolean
          cancellation_window_hours: number
          default_currency: string
          id: string
          maintenance_mode: boolean
          max_booking_hours: number
          max_hourly_rate: number
          min_booking_hours: number
          min_hourly_rate: number
          notify_cleaner_applications: boolean
          notify_new_bookings: boolean
          notify_new_users: boolean
          platform_commission_rate: number
          platform_name: string
          privacy_url: string | null
          require_2fa_admins: boolean
          require_cleaner_verification: boolean
          require_email_verification: boolean
          site_tagline: string | null
          support_email: string | null
          terms_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          advance_booking_days?: number
          allow_instant_booking?: boolean
          auto_approve_cleaners?: boolean
          cancellation_window_hours?: number
          default_currency?: string
          id?: string
          maintenance_mode?: boolean
          max_booking_hours?: number
          max_hourly_rate?: number
          min_booking_hours?: number
          min_hourly_rate?: number
          notify_cleaner_applications?: boolean
          notify_new_bookings?: boolean
          notify_new_users?: boolean
          platform_commission_rate?: number
          platform_name?: string
          privacy_url?: string | null
          require_2fa_admins?: boolean
          require_cleaner_verification?: boolean
          require_email_verification?: boolean
          site_tagline?: string | null
          support_email?: string | null
          terms_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          advance_booking_days?: number
          allow_instant_booking?: boolean
          auto_approve_cleaners?: boolean
          cancellation_window_hours?: number
          default_currency?: string
          id?: string
          maintenance_mode?: boolean
          max_booking_hours?: number
          max_hourly_rate?: number
          min_booking_hours?: number
          min_hourly_rate?: number
          notify_cleaner_applications?: boolean
          notify_new_bookings?: boolean
          notify_new_users?: boolean
          platform_commission_rate?: number
          platform_name?: string
          privacy_url?: string | null
          require_2fa_admins?: boolean
          require_cleaner_verification?: boolean
          require_email_verification?: boolean
          site_tagline?: string | null
          support_email?: string | null
          terms_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_verification_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          insurance_expiry_date: string | null
          notes: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url?: string | null
          id?: string
          insurance_expiry_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          insurance_expiry_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          address: string
          assigned_provider_id: string | null
          city: string | null
          created_at: string
          customer_id: string | null
          id: string
          latitude: number | null
          listing_id: string | null
          longitude: number | null
          notes: string | null
          preferred_datetime: string | null
          quote_type: string
          services: Json
          status: Database["public"]["Enums"]["quote_request_status"]
          updated_at: string
        }
        Insert: {
          address: string
          assigned_provider_id?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          notes?: string | null
          preferred_datetime?: string | null
          quote_type?: string
          services?: Json
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          assigned_provider_id?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          notes?: string | null
          preferred_datetime?: string | null
          quote_type?: string
          services?: Json
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_responses: {
        Row: {
          created_at: string
          id: string
          message: string | null
          price_amount: number
          provider_id: string
          quote_request_id: string
          status: Database["public"]["Enums"]["quote_response_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          price_amount: number
          provider_id: string
          quote_request_id: string
          status?: Database["public"]["Enums"]["quote_response_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          price_amount?: number
          provider_id?: string
          quote_request_id?: string
          status?: Database["public"]["Enums"]["quote_response_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_responses_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          cleaner_profile_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          cleaner_profile_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          cleaner_profile_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cleaner_profile_id_fkey"
            columns: ["cleaner_profile_id"]
            isOneToOne: false
            referencedRelation: "cleaner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_listings: {
        Row: {
          category: string
          cleaner_profile_id: string
          created_at: string
          delivery_time: string | null
          description: string
          duration_hours: number | null
          features: string[] | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          max_orders: number | null
          orders_count: number
          price: number
          price_type: string
          service_area: string[] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category?: string
          cleaner_profile_id: string
          created_at?: string
          delivery_time?: string | null
          description: string
          duration_hours?: number | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          max_orders?: number | null
          orders_count?: number
          price?: number
          price_type?: string
          service_area?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category?: string
          cleaner_profile_id?: string
          created_at?: string
          delivery_time?: string | null
          description?: string
          duration_hours?: number | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          max_orders?: number | null
          orders_count?: number
          price?: number
          price_type?: string
          service_area?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_cleaner_profile_id_fkey"
            columns: ["cleaner_profile_id"]
            isOneToOne: false
            referencedRelation: "cleaner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_listings: {
        Row: {
          cleaner_profile_id: string
          created_at: string
          id: string
          is_sponsored: boolean
          sponsored_book_clicks: number
          sponsored_end: string | null
          sponsored_note: string | null
          sponsored_priority: number
          sponsored_quote_clicks: number
          sponsored_start: string | null
          sponsored_status: Database["public"]["Enums"]["sponsored_status"]
          sponsored_views_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cleaner_profile_id: string
          created_at?: string
          id?: string
          is_sponsored?: boolean
          sponsored_book_clicks?: number
          sponsored_end?: string | null
          sponsored_note?: string | null
          sponsored_priority?: number
          sponsored_quote_clicks?: number
          sponsored_start?: string | null
          sponsored_status?: Database["public"]["Enums"]["sponsored_status"]
          sponsored_views_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cleaner_profile_id?: string
          created_at?: string
          id?: string
          is_sponsored?: boolean
          sponsored_book_clicks?: number
          sponsored_end?: string | null
          sponsored_note?: string | null
          sponsored_priority?: number
          sponsored_quote_clicks?: number
          sponsored_start?: string | null
          sponsored_status?: Database["public"]["Enums"]["sponsored_status"]
          sponsored_views_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_listings_cleaner_profile_id_fkey"
            columns: ["cleaner_profile_id"]
            isOneToOne: true
            referencedRelation: "cleaner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          payment_method: string
          plan_id: string
          rejection_reason: string | null
          status: string
          submitted_at: string
          subscription_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          payment_method?: string
          plan_id: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          subscription_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          payment_method?: string
          plan_id?: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          subscription_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          booking_discount_percent: number | null
          commission_discount: number | null
          created_at: string
          description: string | null
          express_booking: boolean | null
          features: Json
          id: string
          includes_analytics_access: boolean | null
          includes_verification_badge: boolean | null
          is_active: boolean
          monthly_price: number
          name: string
          premium_support: boolean | null
          priority_booking: boolean | null
          priority_listing_boost: number | null
          target_audience: string
          tier: string
          updated_at: string
        }
        Insert: {
          booking_discount_percent?: number | null
          commission_discount?: number | null
          created_at?: string
          description?: string | null
          express_booking?: boolean | null
          features?: Json
          id?: string
          includes_analytics_access?: boolean | null
          includes_verification_badge?: boolean | null
          is_active?: boolean
          monthly_price?: number
          name: string
          premium_support?: boolean | null
          priority_booking?: boolean | null
          priority_listing_boost?: number | null
          target_audience: string
          tier: string
          updated_at?: string
        }
        Update: {
          booking_discount_percent?: number | null
          commission_discount?: number | null
          created_at?: string
          description?: string | null
          express_booking?: boolean | null
          features?: Json
          id?: string
          includes_analytics_access?: boolean | null
          includes_verification_badge?: boolean | null
          is_active?: boolean
          monthly_price?: number
          name?: string
          premium_support?: boolean | null
          priority_booking?: boolean | null
          priority_listing_boost?: number | null
          target_audience?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          label: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          label: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          label?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          next_billing_date: string | null
          payment_method: string
          plan_id: string
          start_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_method?: string
          plan_id: string
          start_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_method?: string
          plan_id?: string
          start_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_topup_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          proof_image_url: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_topup_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
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
      can_view_profile: { Args: { _target: string }; Returns: boolean }
      credit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      debit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_public_platform_settings: {
        Args: never
        Returns: {
          advance_booking_days: number
          allow_instant_booking: boolean
          cancellation_window_hours: number
          default_currency: string
          id: string
          maintenance_mode: boolean
          max_booking_hours: number
          max_hourly_rate: number
          min_booking_hours: number
          min_hourly_rate: number
          platform_commission_rate: number
          platform_name: string
          privacy_url: string
          require_cleaner_verification: boolean
          site_tagline: string
          support_email: string
          terms_url: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_sponsored_clicks: {
        Args: { click_type: string; listing_id: string }
        Returns: undefined
      }
      increment_sponsored_views: {
        Args: { listing_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "cleaner" | "company" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "verified" | "rejected"
      quote_request_status:
        | "new"
        | "assigned"
        | "responded"
        | "booked"
        | "closed"
        | "rejected"
      quote_response_status: "sent" | "accepted" | "declined"
      sponsored_status: "inactive" | "requested" | "active" | "expired"
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
      app_role: ["customer", "cleaner", "company", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "verified", "rejected"],
      quote_request_status: [
        "new",
        "assigned",
        "responded",
        "booked",
        "closed",
        "rejected",
      ],
      quote_response_status: ["sent", "accepted", "declined"],
      sponsored_status: ["inactive", "requested", "active", "expired"],
    },
  },
} as const
