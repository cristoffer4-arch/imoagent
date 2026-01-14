export interface Goal {
  id: string;
  user_id: string;
  annual_revenue_target: number;
  monthly_leads_target: number;
  monthly_visits_target: number;
  monthly_listings_target: number;
  monthly_proposals_target: number;
  monthly_closings_target: number;
  created_at: string;
  updated_at: string;
}

export interface KPI {
  id: string;
  user_id: string;
  date: string;
  leads_generated: number;
  visits_completed: number;
  properties_listed: number;
  properties_sold: number;
  conversion_rate: number;
  average_ticket: number;
  commissions: number;
  created_at: string;
}

export interface CoachingSession {
  id: string;
  user_id: string;
  session_type: 'diagnosis' | 'goal_setting' | 'review' | 'strategy' | 'action_plan';
  messages: ChatMessage[];
  insights: string[];
  commitments: string[];
  follow_ups: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ActionItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'calls' | 'visits' | 'prospecting' | 'study' | 'follow_up';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  completed_at?: string;
  created_at: string;
}

export interface DISCProfile {
  id: string;
  user_id: string;
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
  primary_style: 'D' | 'I' | 'S' | 'C';
  communication_tips: string[];
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  points: number;
  earned_at: string;
}

export interface UserStats {
  total_points: number;
  level: number;
  achievements: Achievement[];
  current_streak: number;
  longest_streak: number;
}
