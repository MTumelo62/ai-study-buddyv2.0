export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export type FileProcessResult = {
  content: string;
  mimeType: string;
  name: string;
};

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'study' | 'quiz';
  details: string;
  timestamp: string;
}
