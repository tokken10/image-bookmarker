import type { ImageBookmark } from '../types';

export type CsvBookmark = {
  url: string;
  title?: string;
  sourceUrl?: string;
  categories?: string[];
  mimeType?: string;
  mediaType?: 'image' | 'video';
  createdAt?: number;
};

const HEADER_LABELS = [
  'url',
  'title',
  'sourceUrl',
  'categories',
  'mediaType',
  'mimeType',
  'createdAt',
];

const headerMap: Record<string, keyof CsvBookmark> = {
  url: 'url',
  imageurl: 'url',
  image: 'url',
  title: 'title',
  name: 'title',
  sourceurl: 'sourceUrl',
  source: 'sourceUrl',
  sourcepage: 'sourceUrl',
  sourcepageurl: 'sourceUrl',
  categories: 'categories',
  category: 'categories',
  tags: 'categories',
  mediatype: 'mediaType',
  type: 'mediaType',
  mimetype: 'mimeType',
  mime: 'mimeType',
  createdat: 'createdAt',
  created: 'createdAt',
  timestamp: 'createdAt',
};

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildBookmarksCsv(bookmarks: ImageBookmark[]): string {
  const rows = bookmarks.map((bookmark) => [
    bookmark.url,
    bookmark.title ?? '',
    bookmark.sourceUrl ?? '',
    bookmark.categories?.join(' | ') ?? '',
    bookmark.mediaType ?? '',
    bookmark.mimeType ?? '',
    bookmark.createdAt ? new Date(bookmark.createdAt).toISOString() : '',
  ]);

  const csvRows = [HEADER_LABELS, ...rows].map((row) =>
    row.map((cell) => escapeCsvValue(cell)).join(',')
  );

  return csvRows.join('\n');
}

function normalizeHeader(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        const nextChar = text[i + 1];
        if (nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\n') {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);

  return rows;
}

function parseCategories(value: string): string[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const delimiterMatch = trimmed.match(/[|;]/);
  const delimiter = delimiterMatch ? delimiterMatch[0] : ',';
  const parts = trimmed
    .split(delimiter)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : undefined;
}

function parseCreatedAt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const date = Date.parse(trimmed);
  return Number.isNaN(date) ? undefined : date;
}

function parseMediaType(value: string): 'image' | 'video' | undefined {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'image' || trimmed === 'video') {
    return trimmed;
  }
  return undefined;
}

export function parseBookmarksCsv(text: string): CsvBookmark[] {
  const rows = parseCsvRows(text).filter((row) =>
    row.some((cell) => cell.trim().length > 0)
  );
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const columnMap = new Map<keyof CsvBookmark, number>();

  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    const key = headerMap[normalized];
    if (key) {
      columnMap.set(key, index);
    }
  });

  if (!columnMap.has('url')) {
    return [];
  }

  const getCell = (row: string[], key: keyof CsvBookmark): string => {
    const index = columnMap.get(key);
    return index === undefined ? '' : row[index] ?? '';
  };

  return dataRows
    .map((row) => {
      const url = getCell(row, 'url').trim();
      if (!url) {
        return null;
      }

      const title = getCell(row, 'title').trim();
      const sourceUrl = getCell(row, 'sourceUrl').trim();
      const categories = parseCategories(getCell(row, 'categories'));
      const mimeType = getCell(row, 'mimeType').trim();
      const mediaType = parseMediaType(getCell(row, 'mediaType'));
      const createdAt = parseCreatedAt(getCell(row, 'createdAt'));

      return {
        url,
        title: title || undefined,
        sourceUrl: sourceUrl || undefined,
        categories,
        mimeType: mimeType || undefined,
        mediaType,
        createdAt,
      } satisfies CsvBookmark;
    })
    .filter((entry): entry is CsvBookmark => Boolean(entry));
}
