export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Reaction = "positive" | "neutral" | "negative";

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
  read_at: string | null;
}

export interface ArticleFeedback {
  id: string;
  article_id: string;
  reaction: Reaction;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Article + tilhørende feedback (kommer som array fra PostgREST join) */
export interface ArticleWithFeedback extends Article {
  feedback?: ArticleFeedback[] | null;
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
