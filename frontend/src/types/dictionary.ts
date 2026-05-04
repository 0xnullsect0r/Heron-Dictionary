export type Level = 'basic' | 'standard' | 'advanced';

export interface Definition {
  id: number;
  word_id: number;
  level: Level;
  text: string;
  sentences: string[];
  examples: string[];
  sort_order: number;
}

export interface WordEntry {
  id: number;
  word: string;
  part_of_speech: string;
  etymology: string;
  idioms: { phrase: string; meaning: string }[];
  synonyms: string[];
  related_words: string[];
  usage_notes: string;
  definitions: Definition[];
  created_at: string;
  updated_at: string;
}

export interface WordSummary {
  id: number;
  word: string;
  part_of_speech: string;
}

export interface AdminStats {
  total: number;
  fullyDefined: number;
  incomplete: number;
  recent: { word: string; updated_at: string }[];
}
