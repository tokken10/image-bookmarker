import type { ImageBookmark } from '../types';

export function filterByTopic(images: ImageBookmark[], activeTopic?: string) {
  if (!activeTopic || activeTopic === 'all') return images;
  return images.filter(img => img.topics?.includes(activeTopic));
}
