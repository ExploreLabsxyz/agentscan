export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Chat {
  id: string;
  created_at: string;
}
