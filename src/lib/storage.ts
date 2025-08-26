import type { ImageBookmark } from '../types';

const STORAGE_KEY = 'imageBookmarks:v1';

export function loadBookmarks(): ImageBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

export function saveBookmarks(bookmarks: ImageBookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
}

export function addBookmark(bookmark: Omit<ImageBookmark, 'id' | 'createdAt'>): ImageBookmark {
  const bookmarks = loadBookmarks();
  const newBookmark: ImageBookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  
  const updatedBookmarks = [newBookmark, ...bookmarks];
  saveBookmarks(updatedBookmarks);
  return newBookmark;
}

export function updateBookmark(
  id: string,
  updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt'>>
): ImageBookmark | null {
  const bookmarks = loadBookmarks();
  const index = bookmarks.findIndex(bookmark => bookmark.id === id);
  if (index === -1) return null;

  const updatedBookmark: ImageBookmark = {
    ...bookmarks[index],
    ...updates,
  };

  bookmarks[index] = updatedBookmark;
  saveBookmarks(bookmarks);
  return updatedBookmark;
}

export function removeBookmark(id: string): void {
  const bookmarks = loadBookmarks().filter(bookmark => bookmark.id !== id);
  saveBookmarks(bookmarks);
}

export function removeBookmarks(ids: string[]): void {
  const idSet = new Set(ids);
  const bookmarks = loadBookmarks().filter(bookmark => !idSet.has(bookmark.id));
  saveBookmarks(bookmarks);
}

export function shuffleBookmarks(): ImageBookmark[] {
  const bookmarks = loadBookmarks();
  for (let i = bookmarks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bookmarks[i], bookmarks[j]] = [bookmarks[j], bookmarks[i]];
  }
  saveBookmarks(bookmarks);
  return bookmarks;
}

export function reorderBookmarks(): ImageBookmark[] {
  const bookmarks = loadBookmarks();
  bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  saveBookmarks(bookmarks);
  return bookmarks;
}
