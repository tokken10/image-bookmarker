export type Topic = {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
};

export type ImageBookmark = {
  id: string;
  url: string;
  title?: string;
  createdAt: number;
  topics: string[];
};

export type Store = {
  version: 2;
  topics: Topic[];
  images: ImageBookmark[];
};
