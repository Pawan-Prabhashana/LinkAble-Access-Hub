export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RequestDraft {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  location?: string;
  source: string;
  tags?: string[];
  aiSummary?: string;
  confidence: number;
  reason?: string;
}

export interface ChatIntakeRequest {
  messages: ChatMessage[];
  currentDraft?: RequestDraft | null;
}

export interface ChatIntakeResponse {
  reply: string;
  draft?: RequestDraft | null;
  missingFields: string[];
  followUpQuestion?: string | null;
  readyToCreate: boolean;
  engine: 'rules' | 'llm';
  confidence: number;
}
