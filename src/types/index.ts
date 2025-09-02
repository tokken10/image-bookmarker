export type ImageBookmark = {
  id: string;
  url: string;
  title?: string;
  /**
   * Optional source page URL where this image was found
   */
  sourceUrl?: string;
  /**
   * Optional categories used for filtering bookmarks
   */
  categories?: string[];
  /**
   * Optional list of topics associated with this bookmark
   */
  topics?: string[];
  createdAt: number;
  /**
   * Precomputed tokens used for fast searching
   */
  searchTokens?: string[];
};
