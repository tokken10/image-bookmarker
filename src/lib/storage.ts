import type { ImageBookmark } from '../types';
import { defaultImages } from '../data/defaultImages';
import { buildSearchTokens } from '../utils/search';
import { isSupabaseConfigured, supabase } from './supabase';

const STORAGE_KEY = 'imageBookmarks:v1';
const CUSTOM_CATEGORIES_KEY = 'imageBookmarks:customCategories:v1';
const VIEW_ORDER_KEY_PREFIX = 'imageBookmarks:viewOrder:v1:';

export const LEGACY_BOOKMARKS_STORAGE_KEY = STORAGE_KEY;
export const LEGACY_CUSTOM_CATEGORIES_STORAGE_KEY = CUSTOM_CATEGORIES_KEY;

export type BookmarkImport = {
  url: string;
  title?: string;
  sourceUrl?: string;
  categories?: string[];
  mimeType?: string;
  mediaType?: 'image' | 'video';
  createdAt?: number;
};

type BookmarkRow = {
  id: string;
  user_id: string;
  url: string;
  mime_type: string | null;
  media_type: 'image' | 'video' | null;
  title: string | null;
  source_url: string | null;
  categories: string[] | null;
  topics: string[] | null;
  search_tokens: string[] | null;
  created_at: string;
};

type CustomCategoryRow = {
  id: string;
  user_id: string;
  name: string;
};

type BookmarkCreateInput = Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>;
type BookmarkUpdateInput = Partial<Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>>;

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
}

async function requireAuthenticatedUserId(): Promise<string> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User is not authenticated.');
  }

  return userId;
}

function toIsoDate(value?: number): string {
  return new Date(value ?? Date.now()).toISOString();
}

function normalizeCategoryList(categories?: string[]): string[] {
  if (!categories) {
    return [];
  }

  const unique = new Set(
    categories
      .map((category) => category.trim())
      .filter(Boolean)
  );

  return Array.from(unique);
}

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function deriveMediaType(
  mimeType?: string,
  mediaType?: 'image' | 'video'
): 'image' | 'video' {
  if (mediaType) {
    return mediaType;
  }

  if (mimeType?.startsWith('video/')) {
    return 'video';
  }

  return 'image';
}

function rowToBookmark(row: BookmarkRow): ImageBookmark {
  const bookmark: ImageBookmark = {
    id: row.id,
    url: row.url,
    mimeType: row.mime_type ?? undefined,
    mediaType: row.media_type ?? undefined,
    title: row.title ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    categories: row.categories && row.categories.length > 0 ? row.categories : undefined,
    topics: row.topics && row.topics.length > 0 ? row.topics : undefined,
    createdAt: Date.parse(row.created_at),
    searchTokens: row.search_tokens && row.search_tokens.length > 0 ? row.search_tokens : undefined,
  };

  if (!Number.isFinite(bookmark.createdAt)) {
    bookmark.createdAt = Date.now();
  }

  if (!bookmark.searchTokens) {
    bookmark.searchTokens = buildSearchTokens(bookmark);
  }

  return bookmark;
}

function toUpsertRow(
  bookmark: ImageBookmark,
  userId: string,
  createdAt?: number
): BookmarkRow {
  return {
    id: bookmark.id,
    user_id: userId,
    url: bookmark.url,
    mime_type: bookmark.mimeType ?? null,
    media_type: bookmark.mediaType ?? null,
    title: bookmark.title ?? null,
    source_url: bookmark.sourceUrl ?? null,
    categories: bookmark.categories ?? [],
    topics: bookmark.topics ?? [],
    search_tokens: bookmark.searchTokens ?? buildSearchTokens(bookmark),
    created_at: toIsoDate(createdAt ?? bookmark.createdAt),
  };
}

function parseLegacyBookmarks(): ImageBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<ImageBookmark & { category?: string }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is ImageBookmark & { category?: string } => Boolean(entry?.url))
      .map((entry) => {
        const categories = normalizeCategoryList(
          entry.categories ?? (entry.category ? [entry.category] : undefined)
        );

        const bookmark: ImageBookmark = {
          id: entry.id || crypto.randomUUID(),
          url: entry.url,
          mimeType: entry.mimeType,
          mediaType: entry.mediaType,
          title: normalizeOptionalText(entry.title),
          sourceUrl: normalizeOptionalText(entry.sourceUrl),
          categories: categories.length > 0 ? categories : undefined,
          topics: entry.topics,
          createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
          searchTokens: entry.searchTokens,
        };

        if (!bookmark.searchTokens) {
          bookmark.searchTokens = buildSearchTokens(bookmark);
        }

        return bookmark;
      });
  } catch (error) {
    console.error('Failed to parse legacy local bookmarks:', error);
    return [];
  }
}

function getViewOrderStorageKey(userId: string): string {
  return `${VIEW_ORDER_KEY_PREFIX}${userId}`;
}

function loadViewOrder(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getViewOrderStorageKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch (error) {
    console.error('Failed to load bookmark view order:', error);
    return [];
  }
}

function saveViewOrder(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(getViewOrderStorageKey(userId), JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save bookmark view order:', error);
  }
}

function clearViewOrder(userId: string): void {
  try {
    localStorage.removeItem(getViewOrderStorageKey(userId));
  } catch (error) {
    console.error('Failed to clear bookmark view order:', error);
  }
}

export async function saveCurrentViewOrder(ids: string[]): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  saveViewOrder(userId, ids);
}

export async function clearCurrentViewOrder(): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  clearViewOrder(userId);
}

function removeIdsFromViewOrder(userId: string, idsToRemove: string[]): void {
  const existingOrder = loadViewOrder(userId);
  if (existingOrder.length === 0) {
    return;
  }

  const removeSet = new Set(idsToRemove);
  const nextOrder = existingOrder.filter((id) => !removeSet.has(id));
  if (nextOrder.length !== existingOrder.length) {
    saveViewOrder(userId, nextOrder);
  }
}

function applyViewOrder(userId: string, bookmarks: ImageBookmark[]): ImageBookmark[] {
  const order = loadViewOrder(userId);
  if (order.length === 0 || bookmarks.length === 0) {
    return bookmarks;
  }

  const existingIds = new Set(bookmarks.map((bookmark) => bookmark.id));
  const filteredOrder = order.filter((id) => existingIds.has(id));

  if (filteredOrder.length !== order.length) {
    saveViewOrder(userId, filteredOrder);
  }

  if (filteredOrder.length === 0) {
    return bookmarks;
  }

  const orderIndex = new Map(filteredOrder.map((id, index) => [id, index]));
  return [...bookmarks].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id);
    const rightIndex = orderIndex.get(right.id);

    if (leftIndex === undefined && rightIndex === undefined) {
      return right.createdAt - left.createdAt;
    }

    if (leftIndex === undefined) {
      return 1;
    }

    if (rightIndex === undefined) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

async function fetchBookmarksForUser(userId: string): Promise<BookmarkRow[]> {
  const PAGE_SIZE = 1000;
  const rows: BookmarkRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as BookmarkRow[];
    if (page.length === 0) {
      break;
    }

    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

async function seedDefaultsIfNeeded(userId: string): Promise<void> {
  const existing = await fetchBookmarksForUser(userId);
  if (existing.length > 0) {
    return;
  }

  const now = Date.now();
  const rows: BookmarkRow[] = defaultImages.map((image, index) => {
    const bookmark: ImageBookmark = {
      id: crypto.randomUUID(),
      url: image.url,
      title: image.title,
      categories: image.categories,
      createdAt: now + (defaultImages.length - index),
      mediaType: 'image',
    };

    bookmark.searchTokens = buildSearchTokens(bookmark);

    return toUpsertRow(bookmark, userId, bookmark.createdAt);
  });

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from('bookmarks').insert(rows);
  if (error) {
    throw error;
  }
}

async function updateRows(rows: Array<Partial<BookmarkRow> & { id: string; user_id: string }>): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const CHUNK_SIZE = 100;

  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    const chunk = rows.slice(index, index + CHUNK_SIZE);

    const results = await Promise.all(
      chunk.map(async (row) => {
        const { id, user_id: userId, ...patch } = row;
        const { error } = await supabase
          .from('bookmarks')
          .update(patch)
          .eq('id', id)
          .eq('user_id', userId);

        return error;
      })
    );

    const failed = results.find((result) => result !== null);
    if (failed) {
      throw failed;
    }
  }
}

export function normalizeBookmarkUrl(value: string): string {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${normalizedPath || '/'}${parsed.search}`;
  } catch {
    return trimmed.replace(/\s+/g, '');
  }
}

export async function loadBookmarks(): Promise<ImageBookmark[]> {
  const userId = await requireAuthenticatedUserId();
  await seedDefaultsIfNeeded(userId);

  const rows = await fetchBookmarksForUser(userId);
  const bookmarks = rows.map(rowToBookmark);

  const missingTokens = bookmarks.filter((_bookmark, index) => {
    const rowTokens = rows[index]?.search_tokens;
    return !rowTokens || rowTokens.length === 0;
  });

  if (missingTokens.length > 0) {
    const updates = missingTokens.map((bookmark) => ({
      id: bookmark.id,
      user_id: userId,
      search_tokens: buildSearchTokens(bookmark),
    }));

    try {
      await updateRows(updates);
    } catch (error) {
      console.error('Failed to backfill search tokens:', error);
    }
  }

  return applyViewOrder(userId, bookmarks);
}

export async function isDuplicateUrl(url: string): Promise<boolean> {
  const normalized = normalizeBookmarkUrl(url);
  const bookmarks = await loadBookmarks();
  return bookmarks.some((bookmark) => normalizeBookmarkUrl(bookmark.url) === normalized);
}

export async function moveBookmarkToFrontByUrl(url: string): Promise<ImageBookmark[] | null> {
  const userId = await requireAuthenticatedUserId();
  const normalized = normalizeBookmarkUrl(url);
  const bookmarks = await loadBookmarks();
  const match = bookmarks.find((bookmark) => normalizeBookmarkUrl(bookmark.url) === normalized);

  if (!match) {
    return null;
  }

  const reordered = [match, ...bookmarks.filter((bookmark) => bookmark.id !== match.id)];
  saveViewOrder(userId, reordered.map((bookmark) => bookmark.id));
  return reordered;
}

export async function addBookmark(bookmark: BookmarkCreateInput): Promise<ImageBookmark> {
  const userId = await requireAuthenticatedUserId();

  const normalizedCategories = normalizeCategoryList(bookmark.categories);
  const createdAt = Date.now();
  const nextBookmark: ImageBookmark = {
    id: crypto.randomUUID(),
    url: bookmark.url.trim(),
    title: normalizeOptionalText(bookmark.title),
    sourceUrl: normalizeOptionalText(bookmark.sourceUrl),
    mimeType: normalizeOptionalText(bookmark.mimeType),
    mediaType: deriveMediaType(bookmark.mimeType, bookmark.mediaType),
    categories: normalizedCategories.length > 0 ? normalizedCategories : undefined,
    topics: bookmark.topics,
    createdAt,
  };

  nextBookmark.searchTokens = buildSearchTokens(nextBookmark);

  const row = toUpsertRow(nextBookmark, userId, createdAt);

  const { data, error } = await supabase.from('bookmarks').insert(row).select('*').single();
  if (error) {
    throw error;
  }

  const inserted = rowToBookmark(data as BookmarkRow);

  const existingOrder = loadViewOrder(userId);
  if (existingOrder.length > 0) {
    saveViewOrder(userId, [inserted.id, ...existingOrder.filter((id) => id !== inserted.id)]);
  }

  return inserted;
}

export async function addBookmarksFromImport(entries: BookmarkImport[]): Promise<{
  added: number;
  skipped: number;
}> {
  const userId = await requireAuthenticatedUserId();
  const existingBookmarks = await loadBookmarks();
  const normalizedUrls = new Set(
    existingBookmarks.map((bookmark) => normalizeBookmarkUrl(bookmark.url))
  );

  let skipped = 0;
  const rowsToInsert: BookmarkRow[] = [];

  entries.forEach((entry, index) => {
    const trimmedUrl = entry.url.trim();
    const normalizedUrl = normalizeBookmarkUrl(trimmedUrl);

    if (!trimmedUrl || normalizedUrls.has(normalizedUrl)) {
      skipped += 1;
      return;
    }

    const categories = normalizeCategoryList(entry.categories);

    const nextBookmark: ImageBookmark = {
      id: crypto.randomUUID(),
      url: trimmedUrl,
      title: normalizeOptionalText(entry.title),
      sourceUrl: normalizeOptionalText(entry.sourceUrl),
      mimeType: normalizeOptionalText(entry.mimeType),
      mediaType: deriveMediaType(entry.mimeType, entry.mediaType),
      categories: categories.length > 0 ? categories : undefined,
      createdAt: entry.createdAt ?? Date.now() + index,
    };

    nextBookmark.searchTokens = buildSearchTokens(nextBookmark);

    rowsToInsert.push(toUpsertRow(nextBookmark, userId, nextBookmark.createdAt));
    normalizedUrls.add(normalizedUrl);
  });

  if (rowsToInsert.length === 0) {
    return { added: 0, skipped };
  }

  const { error } = await supabase.from('bookmarks').insert(rowsToInsert);
  if (error) {
    throw error;
  }

  const existingOrder = loadViewOrder(userId);
  if (existingOrder.length > 0) {
    const insertedIds = [...rowsToInsert]
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
      .map((row) => row.id);
    const existingSet = new Set(insertedIds);

    saveViewOrder(
      userId,
      [...insertedIds, ...existingOrder.filter((id) => !existingSet.has(id))]
    );
  }

  return { added: rowsToInsert.length, skipped };
}

export async function updateBookmark(
  id: string,
  updates: BookmarkUpdateInput
): Promise<ImageBookmark | null> {
  const userId = await requireAuthenticatedUserId();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const current = rowToBookmark(data as BookmarkRow);
  const updatedCategories =
    'categories' in updates ? normalizeCategoryList(updates.categories) : undefined;

  const nextBookmark: ImageBookmark = {
    ...current,
    ...updates,
    title: 'title' in updates ? normalizeOptionalText(updates.title) : current.title,
    sourceUrl:
      'sourceUrl' in updates
        ? normalizeOptionalText(updates.sourceUrl)
        : current.sourceUrl,
    mimeType: 'mimeType' in updates ? normalizeOptionalText(updates.mimeType) : current.mimeType,
    categories:
      'categories' in updates
        ? updatedCategories && updatedCategories.length > 0
          ? updatedCategories
          : undefined
        : current.categories,
  };

  nextBookmark.searchTokens = buildSearchTokens(nextBookmark);

  const patch = toUpsertRow(nextBookmark, userId, nextBookmark.createdAt);

  const { data: updatedRow, error: updateError } = await supabase
    .from('bookmarks')
    .update({
      url: patch.url,
      mime_type: patch.mime_type,
      media_type: patch.media_type,
      title: patch.title,
      source_url: patch.source_url,
      categories: patch.categories,
      topics: patch.topics,
      search_tokens: patch.search_tokens,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRow) {
    return null;
  }

  return rowToBookmark(updatedRow as BookmarkRow);
}

export async function updateBookmarksBulk(
  ids: string[],
  updates: BookmarkUpdateInput
): Promise<ImageBookmark[]> {
  const userId = await requireAuthenticatedUserId();
  if (ids.length === 0) {
    return loadBookmarks();
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .in('id', ids);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as BookmarkRow[];
  if (rows.length === 0) {
    return loadBookmarks();
  }

  const normalizedTitle = 'title' in updates ? normalizeOptionalText(updates.title) : undefined;
  const normalizedCategories =
    'categories' in updates ? normalizeCategoryList(updates.categories) : undefined;

  const rowsToUpsert: BookmarkRow[] = rows.map((row) => {
    const current = rowToBookmark(row);

    const nextBookmark: ImageBookmark = {
      ...current,
      ...updates,
      title: 'title' in updates ? normalizedTitle : current.title,
      categories:
        'categories' in updates
          ? normalizedCategories && normalizedCategories.length > 0
            ? normalizedCategories
            : undefined
          : current.categories,
    };

    nextBookmark.searchTokens = buildSearchTokens(nextBookmark);

    return toUpsertRow(nextBookmark, userId, nextBookmark.createdAt);
  });

  await updateRows(rowsToUpsert);
  return loadBookmarks();
}

export async function removeBookmark(id: string): Promise<void> {
  const userId = await requireAuthenticatedUserId();

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  removeIdsFromViewOrder(userId, [id]);
}

export async function removeBookmarks(ids: string[]): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);

  if (error) {
    throw error;
  }

  removeIdsFromViewOrder(userId, ids);
}

export async function shuffleBookmarks(): Promise<ImageBookmark[]> {
  const userId = await requireAuthenticatedUserId();
  const bookmarks = await loadBookmarks();

  const shuffled = [...bookmarks];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  saveViewOrder(userId, shuffled.map((bookmark) => bookmark.id));
  return shuffled;
}

export async function reorderBookmarks(): Promise<ImageBookmark[]> {
  const userId = await requireAuthenticatedUserId();
  clearViewOrder(userId);
  return loadBookmarks();
}

export async function removeCategoryFromBookmarks(category: string): Promise<ImageBookmark[]> {
  const userId = await requireAuthenticatedUserId();
  const bookmarks = await loadBookmarks();

  const rowsToUpdate: BookmarkRow[] = bookmarks
    .filter((bookmark) => bookmark.categories?.includes(category))
    .map((bookmark) => {
      const filtered = bookmark.categories?.filter((item) => item !== category) ?? [];

      const nextBookmark: ImageBookmark = {
        ...bookmark,
        categories: filtered.length > 0 ? filtered : undefined,
      };

      nextBookmark.searchTokens = buildSearchTokens(nextBookmark);

      return toUpsertRow(nextBookmark, userId, nextBookmark.createdAt);
    });

  await updateRows(rowsToUpdate);
  return loadBookmarks();
}

export async function loadCustomCategories(): Promise<string[]> {
  const userId = await requireAuthenticatedUserId();

  const { data, error } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CustomCategoryRow[];
  const unique = new Set(rows.map((row) => row.name.trim()).filter(Boolean));
  return Array.from(unique);
}

export async function saveCustomCategories(categories: string[]): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  const normalized = normalizeCategoryList(categories);

  const { error: deleteError } = await supabase
    .from('custom_categories')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw deleteError;
  }

  if (normalized.length === 0) {
    return;
  }

  const rows: CustomCategoryRow[] = normalized.map((name) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    name,
  }));

  const { error: insertError } = await supabase.from('custom_categories').insert(rows);
  if (insertError) {
    throw insertError;
  }
}

export function loadLegacyLocalBookmarks(): ImageBookmark[] {
  return parseLegacyBookmarks();
}

export function loadLegacyCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeCategoryList(
      parsed.filter((entry): entry is string => typeof entry === 'string')
    );
  } catch (error) {
    console.error('Failed to parse legacy custom categories:', error);
    return [];
  }
}

export function clearLegacyLocalBookmarks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear legacy bookmarks:', error);
  }
}

export function clearLegacyCustomCategories(): void {
  try {
    localStorage.removeItem(CUSTOM_CATEGORIES_KEY);
  } catch (error) {
    console.error('Failed to clear legacy custom categories:', error);
  }
}
