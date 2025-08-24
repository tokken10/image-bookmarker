import type { ImageBookmark, Store, Topic } from '../types';

const KEY = 'imageBookmarks:store';

function defaultStore(): Store {
  return { version: 2, topics: [], images: [] };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);

    // Migrations
    if (!parsed.version) {
      const images: ImageBookmark[] = (parsed as unknown as ImageBookmark[]).map(i => ({
        ...i,
        topics: Array.isArray((i as { topics?: unknown }).topics)
          ? ((i as { topics?: unknown }).topics as string[])
          : [],
      }));
      return { version: 2, topics: [], images };
    }
    if (parsed.version === 2) return parsed as Store;

    return defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

// Topic helpers
export function addTopic(name: string): Topic {
  const store = loadStore();
  const slug = slugify(name);
  const existing = store.topics.find(t => t.slug === slug);
  if (existing) return existing;
  const topic: Topic = { id: uuid(), name: name.trim(), slug, createdAt: Date.now() };
  store.topics.unshift(topic);
  saveStore(store);
  return topic;
}

export function renameTopic(oldSlug: string, newName: string) {
  const store = loadStore();
  const topic = store.topics.find(t => t.slug === oldSlug);
  if (!topic) return;
  const newSlug = slugify(newName);
  topic.name = newName.trim();
  topic.slug = newSlug;
  store.images.forEach(img => {
    img.topics = img.topics.map(s => (s === oldSlug ? newSlug : s));
  });
  saveStore(store);
}

export function deleteTopic(slug: string) {
  const store = loadStore();
  store.topics = store.topics.filter(t => t.slug !== slug);
  store.images.forEach(img => {
    img.topics = img.topics.filter(s => s !== slug);
  });
  saveStore(store);
}

// Image helpers
export function addImage(image: Omit<ImageBookmark, 'id' | 'createdAt'>) {
  const store = loadStore();
  const item: ImageBookmark = { id: uuid(), createdAt: Date.now(), ...image };
  store.images.unshift(item);
  saveStore(store);
  return item;
}

export function updateImage(id: string, updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt'>>) {
  const store = loadStore();
  const img = store.images.find(i => i.id === id);
  if (!img) return;
  Object.assign(img, updates);
  saveStore(store);
  return img;
}

export function updateImageTopics(imageId: string, topicSlugs: string[]) {
  const store = loadStore();
  const img = store.images.find(i => i.id === imageId);
  if (!img) return;
  img.topics = Array.from(new Set(topicSlugs));
  saveStore(store);
}

export function deleteImage(id: string) {
  const store = loadStore();
  store.images = store.images.filter(i => i.id !== id);
  saveStore(store);
}

// utils
export function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
