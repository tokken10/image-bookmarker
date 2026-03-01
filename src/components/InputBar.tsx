import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { isValidImageUrl } from '../utils/validation';
import { addBookmark, moveBookmarkToFrontByUrl, normalizeBookmarkUrl } from '../lib/storage';
import { buildSearchTokens } from '../utils/search';

interface InputBarProps {
  onOptimisticBookmarkAdd: (bookmark: ImageBookmark) => void;
  onOptimisticBookmarkResolve: (temporaryId: string, bookmark: ImageBookmark) => void;
  onOptimisticBookmarkRemove: (temporaryId: string) => void;
  onBookmarksReordered: (bookmarks: ImageBookmark[]) => void;
  currentBookmarks: ImageBookmark[];
  selectedCategories: string[];
  onClose: () => void;
}

export default function InputBar({
  onOptimisticBookmarkAdd,
  onOptimisticBookmarkResolve,
  onOptimisticBookmarkRemove,
  onBookmarksReordered,
  currentBookmarks,
  selectedCategories,
  onClose,
}: InputBarProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [categories, setCategories] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCategories(selectedCategories.length > 0 ? selectedCategories.join(', ') : '');
  }, [selectedCategories]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let temporaryId: string | null = null;

    if (!url.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (!isValidImageUrl(url)) {
      setError('Please enter a valid image URL (jpg, jpeg, png, gif, webp, svg)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const normalizedCategories = categories
        .split(',')
        .map((category) => category.trim())
        .filter(Boolean);

      const trimmedUrl = url.trim();
      const normalizedInputUrl = normalizeBookmarkUrl(trimmedUrl);
      const duplicate = currentBookmarks.some(
        (b) => normalizeBookmarkUrl(b.url) === normalizedInputUrl
      );

      if (duplicate) {
        const reordered = await moveBookmarkToFrontByUrl(trimmedUrl);
        if (reordered) {
          onBookmarksReordered(reordered);
        }
        setError('This image is already in your bookmarks.');
        setIsSubmitting(false);
        return;
      }

      temporaryId = `pending-${crypto.randomUUID()}`;
      const optimisticBookmark: ImageBookmark = {
        id: temporaryId,
        isPending: true,
        url: trimmedUrl,
        title: title.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        categories: normalizedCategories.length > 0 ? normalizedCategories : undefined,
        mediaType: 'image',
        createdAt: Date.now(),
      };
      optimisticBookmark.searchTokens = buildSearchTokens(optimisticBookmark);
      onOptimisticBookmarkAdd(optimisticBookmark);

      // Close the form immediately so the gallery placeholder is visible.
      setUrl('');
      setTitle('');
      setSourceUrl('');
      setCategories(selectedCategories.length > 0 ? selectedCategories.join(', ') : '');
      onClose();

      // Continue saving in the background.
      const persistedBookmark = await addBookmark({
        url: trimmedUrl,
        title: title.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        categories: normalizedCategories,
      });
      onOptimisticBookmarkResolve(temporaryId, persistedBookmark);
    } catch (submitError) {
      console.error('Failed to add bookmark:', submitError);
      if (temporaryId) {
        onOptimisticBookmarkRemove(temporaryId);
      }
      // If the form is already closed we can't show the error inline;
      // log it — the placeholder will be removed so the user can retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL *
          </label>
          <input
            id="image-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="source-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Source Page URL (optional)
          </label>
          <input
            id="source-url"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://example.com"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="image-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title (optional)
          </label>
          <input
            id="image-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="My beautiful image"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="image-categories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categories (optional, comma separated)
          </label>
          <input
            id="image-categories"
            type="text"
            value={categories}
            onChange={(event) => setCategories(event.target.value)}
            placeholder="e.g. nature, art"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !url.trim()}
            className={`px-4 py-2 rounded-md text-white font-medium ${isSubmitting || !url.trim()
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
          >
            {isSubmitting ? 'Adding...' : 'Add Bookmark'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white font-medium ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700'
              } transition-colors`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
