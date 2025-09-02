import type { ImageBookmark } from '../types';

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(Boolean);
}

export function buildSearchTokens(img: ImageBookmark): string[] {
  const tokens = new Set<string>();
  const add = (value?: string | string[]) => {
    if (!value) return;
    const text = Array.isArray(value) ? value.join(' ') : value;
    tokenize(text).forEach(t => tokens.add(t));
  };
  add(img.title);
  add(img.url);
  add(img.sourceUrl);
  if (img.topics) add(img.topics);
  if (img.categories) add(img.categories);
  // Support legacy single category field
  const legacyCategory = (img as { category?: string }).category;
  if (legacyCategory) add(legacyCategory);
  return Array.from(tokens);
}

export interface SearchResult {
  bookmark: ImageBookmark;
  score: number;
}

export function searchImages(images: ImageBookmark[], query: string): SearchResult[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) {
    return images.map(b => ({ bookmark: b, score: 0 }));
  }

  const results: SearchResult[] = [];

  for (const img of images) {
    const tokens = img.searchTokens || buildSearchTokens(img);
    const titleTokens = img.title ? tokenize(img.title) : [];
    let score = 0;
    for (const qt of qTokens) {
      if (titleTokens.includes(qt)) {
        score += 3;
      } else if (tokens.some(t => t.startsWith(qt))) {
        score += 2;
      } else {
        const urlText =
          (img.url ? normalize(img.url) : '') +
          ' ' +
          (img.sourceUrl ? normalize(img.sourceUrl) : '');
        if (urlText.includes(qt)) {
          score += 1;
        }
      }
    }
    if (score > 0) {
      results.push({ bookmark: img, score });
    }
  }

  results.sort(
    (a, b) =>
      b.score - a.score || b.bookmark.createdAt - a.bookmark.createdAt
  );

  return results;
}

