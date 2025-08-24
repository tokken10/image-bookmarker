export type ImageBookmark = {
  id: string;
  url: string;
  title?: string;
  /**
   * Optional category or topic used for filtering bookmarks
   */
  category?: string;
  createdAt: number;
};
