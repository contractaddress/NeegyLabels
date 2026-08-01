export interface Label {
  address: string;
  chain: string;
  label: string;
  type: string;
  source: string;
  confidence: number | null;
  added_at: string;
}

export interface LabelInput {
  address: string;
  chain: string;
  label: string;
  type?: string;
  source?: string;
  confidence?: number | null;
}

export interface LabelUpdate {
  label?: string;
  type?: string;
  source?: string;
  confidence?: number | null;
}

export interface ApiToken {
  id: string;
  name: string;
  hash: string;
  created_at: string;
  last_used_at: string | null;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}
