
export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface ProjectGist {
  title: string;
  genre: string;
  summary: string;
  targetAudience: string;
  wordCount: string;
  authorNote: string;
}

export enum AppView {
  CHAT = 'CHAT',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  SUBMISSION = 'SUBMISSION'
}
