export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isReading?: boolean;
}

export type Theme = 'light' | 'dark';

export interface AppSettings {
  theme: Theme;
  searchEnabled: boolean;
  deepSeekEnabled: boolean;
  intelligentEnabled: boolean;
  thinkBeforeAct: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  settings: AppSettings;
  sessions: ChatSession[];
  currentSessionId: string | null;
  credits: number;
  lastTokenReset: number;
}

export interface FileEntry {
  name: string;
  language: string;
  content: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'web' | 'minecraft' | 'project';
  language?: string;
  code: string; // Maintain for backward compatibility or main file
  files?: FileEntry[];
  title: string;
}
