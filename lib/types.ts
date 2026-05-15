export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Article {
  id: string;
  url: string;
  content_hash: string;
  title: string;
  summary: string | null;
  learning_value: number | null;
  tags: string[];
  difficulty: Difficulty | null;
  source: string;
  author: string | null;
  reading_time: number | null;
  key_takeaway: string | null;
  published_at: string | null;
  fetched_at: string;
  ai_processed: boolean;
}

export interface AISummary {
  summary: string;
  learning_value: number;
  tags: string[];
  difficulty: Difficulty;
  reading_time: number;
  key_takeaway: string;
}

export interface FetchedArticle {
  external_id: string;
  url: string;
  title: string;
  author: string | null;
  published_at: string | null;
  source: string;
  excerpt: string | null;
}
