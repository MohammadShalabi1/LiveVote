export interface Option {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: Option[];
  created_at?: string;
  creator_token?: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_token: string;
  created_at?: string;
}
