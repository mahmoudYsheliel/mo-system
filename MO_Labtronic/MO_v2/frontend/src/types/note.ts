export interface Note {
  sender?: string;
  content?: string;
  date?: string;
  time?: string;
  noteClass?: string;
}
export interface FetchedNote {
  content: string;
  created: string;
  user_id: string;
}
