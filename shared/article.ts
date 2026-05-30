export type ArticleDetail = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  date: string;
  content: string;
};

export type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  date: string;
  excerpt: string | null;
};

export type ArticleListResponse = {
  data: ArticleListItem[];
  pagination: { page: number; limit: number; total: number };
};
