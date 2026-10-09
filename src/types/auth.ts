import { GraphNode, GraphEdge } from './graph';

export type PlanTier = 'free' | 'pro' | 'team';

export interface UserProfile {
  id: string;
  email: string;
  plan_tier: PlanTier;
  lemon_customer_id?: string | null;
  lemon_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CloudProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
