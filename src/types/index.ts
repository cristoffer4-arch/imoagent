// Database types
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          role: 'agent' | 'admin' | 'manager'
          subscription_plan: 'FREE' | 'PRO' | 'ENTERPRISE'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      properties: {
        Row: {
          id: string
          title: string
          description: string
          type: 'house' | 'apartment' | 'land' | 'commercial'
          status: 'available' | 'sold' | 'rented' | 'pending'
          price: number
          area: number
          bedrooms: number
          bathrooms: number
          address: string
          city: string
          state: string
          zipcode: string
          latitude: number | null
          longitude: number | null
          images: string[]
          agent_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          message: string
          score: number
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          property_id: string | null
          agent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          property_id: string | null
          lead_id: string | null
          agent_id: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string
          type: 'specific' | 'measurable' | 'achievable' | 'relevant' | 'time_bound'
          target_value: number
          current_value: number
          deadline: string
          agent_id: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          points: number
          category: 'sales' | 'leads' | 'goals' | 'activity'
          agent_id: string
          earned_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      rankings: {
        Row: {
          id: string
          agent_id: string
          period: 'daily' | 'weekly' | 'monthly' | 'yearly'
          rank: number
          score: number
          sales_count: number
          leads_count: number
          calculated_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rankings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rankings']['Insert']>
      }
      commissions: {
        Row: {
          id: string
          property_id: string
          agent_id: string
          amount: number
          rate: number
          status: 'pending' | 'paid' | 'cancelled'
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['commissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['commissions']['Insert']>
      }
      documents: {
        Row: {
          id: string
          name: string
          type: 'contract' | 'proposal' | 'id' | 'other'
          url: string
          file_size: number
          property_id: string | null
          agent_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
    }
  }
}

// Component types
export interface PropertyFilter {
  type?: string[]
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  bathrooms?: number
  city?: string
  state?: string
}

export interface SMARTGoal {
  id: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: Date
  progress: number
}

export interface PomodoroSession {
  id: string
  duration: number
  breaks: number
  completedAt: Date
}

export interface PortalScrapeResult {
  portal: string
  properties: Array<{
    title: string
    price: number
    url: string
    images: string[]
  }>
  scrapedAt: Date
}
