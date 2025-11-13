/**
 * Database Types for Pleeno
 *
 * This file will be auto-generated from the Supabase schema once migrations are applied.
 *
 * To generate types, run:
 *   cd supabase
 *   npx supabase start
 *   npx supabase db reset
 *   npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts
 *
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 */

// Placeholder types - will be replaced by auto-generated types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          contact_phone: string | null
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          agency_id: string
          email: string
          full_name: string | null
          role: 'agency_admin' | 'agency_user'
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          agency_id: string
          email: string
          full_name?: string | null
          role: 'agency_admin' | 'agency_user'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          email?: string
          full_name?: string | null
          role?: 'agency_admin' | 'agency_user'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      set_agency_context: {
        Args: Record<string, never>
        Returns: undefined
      }
      get_agency_context: {
        Args: Record<string, never>
        Returns: string | null
      }
      verify_agency_access: {
        Args: {
          target_agency_id: string
        }
        Returns: boolean
      }
    }
    Enums: {}
  }
}
