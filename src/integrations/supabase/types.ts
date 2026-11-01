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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_calls: {
        Row: {
          created_at: string
          function: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          function: string
          id?: string
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          function?: string
          id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          accepted_email_sent_at: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          provisioning_at: string | null
          provisioning_claim: string | null
          recipient_id: string
          request_email_sent_at: string | null
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          accepted_email_sent_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          provisioning_at?: string | null
          provisioning_claim?: string | null
          recipient_id: string
          request_email_sent_at?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          accepted_email_sent_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          provisioning_at?: string | null
          provisioning_claim?: string | null
          recipient_id?: string
          request_email_sent_at?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "connection_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversation_presence: {
        Row: {
          conversation_id: string
          last_seen_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_seen_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_presence_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversation_receipts: {
        Row: {
          conversation_id: string
          digested_at: string | null
          last_read_at: string | null
          last_read_message_id: string | null
          last_reminder_index: number | null
          read_index: number
          reminder_claim: string | null
          reminder_claimed_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          digested_at?: string | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          last_reminder_index?: number | null
          read_index?: number
          reminder_claim?: string | null
          reminder_claimed_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          digested_at?: string | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          last_reminder_index?: number | null
          read_index?: number
          reminder_claim?: string | null
          reminder_claimed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_receipts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_receipts_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          closed_at: string | null
          conversation_sid: string | null
          created_at: string
          id: string
          participant_a_sid: string | null
          participant_b_sid: string | null
          request_id: string
          twilio_closed_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          closed_at?: string | null
          conversation_sid?: string | null
          created_at?: string
          id?: string
          participant_a_sid?: string | null
          participant_b_sid?: string | null
          request_id: string
          twilio_closed_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          closed_at?: string | null
          conversation_sid?: string | null
          created_at?: string
          id?: string
          participant_a_sid?: string | null
          participant_b_sid?: string | null
          request_id?: string
          twilio_closed_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_settings: {
        Row: {
          auto_send_late_invites: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          auto_send_late_invites?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          auto_send_late_invites?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      enrichment_cache: {
        Row: {
          created_at: string
          linkedin_url: string
          result: Json | null
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          linkedin_url: string
          result?: Json | null
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          linkedin_url?: string
          result?: Json | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invitations: {
        Row: {
          billetweb_ref: string | null
          claim_id: string | null
          claimed_at: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          invitation_sent_at: string | null
          last_name: string
          token: string
          used_at: string | null
        }
        Insert: {
          billetweb_ref?: string | null
          claim_id?: string | null
          claimed_at?: string | null
          created_at?: string
          email: string
          first_name?: string
          id?: string
          invitation_sent_at?: string | null
          last_name?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          billetweb_ref?: string | null
          claim_id?: string | null
          claimed_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          invitation_sent_at?: string | null
          last_name?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      message_digests: {
        Row: {
          last_sent_at: string | null
          user_id: string
        }
        Insert: {
          last_sent_at?: string | null
          user_id: string
        }
        Update: {
          last_sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_digests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_events: {
        Row: {
          conversation_id: string
          created_at: string
          excerpt: string
          message_index: number
          message_sid: string
          push_attempted_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          excerpt?: string
          message_index: number
          message_sid: string
          push_attempted_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          excerpt?: string
          message_index?: number
          message_sid?: string
          push_attempted_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_events_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizer_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      profile_status: {
        Row: {
          is_admin: boolean
          is_organizer: boolean
          is_speaker: boolean
          manual_override: boolean
          speaker_id: string | null
          sponsor_id: string | null
          sponsor_tier: string | null
          suspended: boolean
          user_id: string
        }
        Insert: {
          is_admin?: boolean
          is_organizer?: boolean
          is_speaker?: boolean
          manual_override?: boolean
          speaker_id?: string | null
          sponsor_id?: string | null
          sponsor_tier?: string | null
          suspended?: boolean
          user_id: string
        }
        Update: {
          is_admin?: boolean
          is_organizer?: boolean
          is_speaker?: boolean
          manual_override?: boolean
          speaker_id?: string | null
          sponsor_id?: string | null
          sponsor_tier?: string | null
          suspended?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_level: string | null
          city: string | null
          company: string | null
          company_size: string | null
          consent_at: string | null
          created_at: string
          email: string
          first_name: string
          intentions: string[]
          job_tags: string[]
          job_title: string | null
          lang: string
          last_name: string
          linkedin_url: string
          photo_url: string | null
          pitch: string | null
          sector: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_level?: string | null
          city?: string | null
          company?: string | null
          company_size?: string | null
          consent_at?: string | null
          created_at?: string
          email: string
          first_name?: string
          intentions?: string[]
          job_tags?: string[]
          job_title?: string | null
          lang?: string
          last_name?: string
          linkedin_url?: string
          photo_url?: string | null
          pitch?: string | null
          sector?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_level?: string | null
          city?: string | null
          company?: string | null
          company_size?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          intentions?: string[]
          job_tags?: string[]
          job_title?: string | null
          lang?: string
          last_name?: string
          linkedin_url?: string
          photo_url?: string | null
          pitch?: string | null
          sector?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purge_control: {
        Row: {
          completed_at: string | null
          id: boolean
          last_error: string | null
          lease_id: string | null
          lease_until: string | null
          paused: boolean
          preserve_user_ids: string[]
        }
        Insert: {
          completed_at?: string | null
          id?: boolean
          last_error?: string | null
          lease_id?: string | null
          lease_until?: string | null
          paused?: boolean
          preserve_user_ids?: string[]
        }
        Update: {
          completed_at?: string | null
          id?: boolean
          last_error?: string | null
          lease_id?: string | null
          lease_until?: string | null
          paused?: boolean
          preserve_user_ids?: string[]
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
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          handled_at: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_feedback: {
        Row: {
          anon_token: string | null
          choices: string[]
          comment: string
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anon_token?: string | null
          choices?: string[]
          comment?: string
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anon_token?: string | null
          choices?: string[]
          comment?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_likes: {
        Row: {
          created_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sponsor_domains: {
        Row: {
          domain: string
          sponsor_id: string
          tier: string
        }
        Insert: {
          domain: string
          sponsor_id: string
          tier: string
        }
        Update: {
          domain?: string
          sponsor_id?: string
          tier?: string
        }
        Relationships: []
      }
      twilio_cleanup: {
        Row: {
          conversation_sid: string
          created_at: string
        }
        Insert: {
          conversation_sid: string
          created_at?: string
        }
        Update: {
          conversation_sid?: string
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_can_write: { Args: { cid: string }; Returns: undefined }
      can_read_conversation: { Args: { cid: string }; Returns: boolean }
      can_view_profile: { Args: { target: string }; Returns: boolean }
      claim_connection_accept: {
        Args: { actor: string; claim: string; request: string }
        Returns: {
          accepted_email_sent_at: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          provisioning_at: string | null
          provisioning_claim: string | null
          recipient_id: string
          request_email_sent_at: string | null
          requester_id: string
          responded_at: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "connection_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_digest: {
        Args: { p_conversations: string[]; p_user: string }
        Returns: string
      }
      claim_invitation: {
        Args: { claim: string; invite_token: string }
        Returns: string
      }
      claim_purge: { Args: { claim: string }; Returns: boolean }
      complete_invitation: {
        Args: { claim: string; fields: Json; invite_token: string; uid: string }
        Returns: undefined
      }
      conversation_heartbeat: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      decline_connection: { Args: { request: string }; Returns: undefined }
      delete_message: {
        Args: { p_id: string }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      digest_candidates: {
        Args: never
        Returns: {
          conversation_id: string
          digested_at: string
          last_digest_at: string
          last_read_at: string
          oldest_unread_at: string
          recipient_id: string
          sender_id: string
          unread: number
        }[]
      }
      edit_message: {
        Args: { p_body: string; p_id: string }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      feedback_comments: {
        Args: { sid: string }
        Returns: {
          choices: string[]
          comment: string
          first_name: string
          last_name: string
          updated_at: string
          user_id: string
        }[]
      }
      feedback_counts: { Args: { sid: string }; Returns: Json }
      finish_connection_accept:
        | { Args: { claim: string; request: string }; Returns: string }
        | {
            Args: {
              claim: string
              pa: string
              pb: string
              request: string
              sid: string
            }
            Returns: string
          }
      grant_retained_admin: {
        Args: { actor: string; target: string }
        Returns: undefined
      }
      inbox_summaries: {
        Args: never
        Returns: {
          conversation_id: string
          last_at: string
          last_body: string
          last_deleted: boolean
          last_sender: string
          unread: number
        }[]
      }
      is_active_member: { Args: { uid: string }; Returns: boolean }
      mark_read: {
        Args: { p_conversation_id: string; p_message_id: string }
        Returns: undefined
      }
      member_connections: {
        Args: never
        Returns: {
          cancelled_at: string
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }[]
      }
      messaging_closed: { Args: never; Returns: boolean }
      request_connection: { Args: { target: string }; Returns: string }
      reserve_ai_call: { Args: { kind: string; uid: string }; Returns: string }
      reserve_enrichment: {
        Args: { uid: string; url: string }
        Returns: boolean
      }
      send_message: {
        Args: {
          p_body: string
          p_conversation_id: string
          p_id: string
          p_reply_to_id?: string
        }
        Returns: Json
      }
      set_purge_paused: { Args: { value: boolean }; Returns: undefined }
      toggle_reaction: {
        Args: { p_emoji: string; p_message_id: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
