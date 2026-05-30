export type AnnouncementStatus = 'active' | 'expired' | 'all';

export type AnnouncementItem = {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  expires_at: string;
};

export type AnnouncementListResponse = {
  data: AnnouncementItem[];
  pagination: { page: number; limit: number; total: number };
};
