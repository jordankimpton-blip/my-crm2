export interface Contact {
  id: number;
  name: string;
  company?: string | null;
  role?: string | null;
  linkedin?: string | null;
  notes?: string | null;
  date?: string | null;
  created_at: string;
}

export interface Action {
  id: number;
  contact_id?: number | null;
  text: string;
  due_date?: string | null;
  done: boolean;
  created_at: string;
}
