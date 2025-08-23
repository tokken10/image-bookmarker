import { describe, expect, it } from 'vitest';
import type { ImageBookmark } from '../types';
import { filterBookmarks } from './filterBookmarks';

const bookmarks: ImageBookmark[] = [
  { id: '1', url: 'https://example.com/cat.jpg', title: 'Cat', createdAt: 0 },
  { id: '2', url: 'https://example.com/dog.jpg', title: 'Dog', createdAt: 0 },
  { id: '3', url: 'https://example.com/bird.jpg', createdAt: 0 },
];

describe('filterBookmarks', () => {
  it('returns all bookmarks when query is empty', () => {
    expect(filterBookmarks(bookmarks, '')).toEqual(bookmarks);
  });

  it('filters by title', () => {
    const result = filterBookmarks(bookmarks, 'cat');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by URL', () => {
    const result = filterBookmarks(bookmarks, 'dog');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('is case-insensitive', () => {
    const result = filterBookmarks(bookmarks, 'BIRD');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});
