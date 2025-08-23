import type { ImageBookmark } from '../types';

export function filterBookmarks(bookmarks: ImageBookmark[], query: string): ImageBookmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return bookmarks;
  return bookmarks.filter(b =>
    (b.title && b.title.toLowerCase().includes(q)) ||
    b.url.toLowerCase().includes(q)
  );
}
