import type { ImageBookmark } from '../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check if the URL has a valid image extension
    const hasValidExtension = IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
    
    // Basic URL validation
    const isValidUrl = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    
    return hasValidExtension && isValidUrl;
  } catch {
    return false;
  }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isVideoBookmark(bookmark: ImageBookmark): boolean {
  if (bookmark.mediaType === 'video') {
    return true;
  }
  if (bookmark.mimeType?.startsWith('video/')) {
    return true;
  }
  return bookmark.url.startsWith('data:video/');
}
