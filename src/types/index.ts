// Authentication & User Types
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AuthSession {
  user: AdminUser;
  access_token: string;
  refresh_token?: string;
}

// User Management Types
export interface SurveyUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  user_role: 'creator' | 'filler';
  wallet_balance: number;
  total_surveys_created: number;
  total_responses_filled: number;
  avatar_url?: string;
  status: 'active' | 'blocked' | 'suspended' | 'banned';
  suspension_end_date?: string | null;
  total_reports: number;
  created_at: string;
  last_login?: string;
  verified: boolean;
}

// Survey Types
export interface Survey {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'downed';
  category: string;
  reward_per_response: number;
  total_responses_collected: number;
  target_responses: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  total_reports: number;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating' | 'checkbox';
  options?: string[];
  order: number;
  required: boolean;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  responder_id: string;
  responses: Record<string, any>;
  submitted_at: string;
}

// Report Types
export interface Report {
  id: string;
  report_type: 'survey' | 'user';
  target_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  attachments?: string[];
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  created_at: string;
  admin_action?: string;
  admin_notes?: string;
  report_count?: number;
}

// Moderation Types
export interface ModerationLog {
  id: string;
  admin_id: string;
  action_type: 'warning' | 'survey_down' | 'account_suspend' | 'account_ban' | 'dismiss_report';
  target_type: 'survey' | 'user';
  target_id: string;
  reason: string;
  notes?: string;
  duration_days?: number;
  created_at: string;
}

export interface UserStrike {
  id: string;
  user_id: string;
  strike_count: number;
  last_strike_date: string;
  reason: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund';
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  rejection_reason?: string;
  bank_account?: string;
}

// Notification Types
export interface AdminNotification {
  id: string;
  admin_id: string;
  type: 'report_threshold' | 'withdrawal_request' | 'new_creator' | 'payment_failure' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

// Alert Types
export interface RealtimeAlert {
  id: string;
  type: 'user_registration' | 'survey_published' | 'survey_reported' | 'withdrawal_requested' | 'user_suspended' | 'system_error';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Analytics Types
export interface DashboardStats {
  total_users: number;
  total_creators: number;
  total_fillers: number;
  active_surveys: number;
  draft_surveys: number;
  pending_reports: number;
  total_revenue: number;
  withdrawals_pending: number;
  blocked_users: number;
  todays_signups: number;
  todays_surveys: number;
  todays_responses: number;
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface SurveyCompletionData {
  survey_id: string;
  title: string;
  completion_rate: number;
  total_responses: number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreateAdminFormData {
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
