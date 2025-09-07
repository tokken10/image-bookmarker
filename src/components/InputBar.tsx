import { useEffect, useState } from 'react';
import { isValidImageUrl } from '../utils/validation';
import { addBookmark } from '../lib/storage';

interface InputBarProps {
  onAddBookmark: () => void;
  selectedCategory: string;
  onClose: () => void;
}

export default function InputBar({ onAddBookmark, selectedCategory, onClose }: InputBarProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [categories, setCategories] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Default the categories input to the currently selected category
    setCategories(selectedCategory !== 'All' ? selectedCategory : '');
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Test if the image can be loaded
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      // Add to bookmarks if image loads successfully
      addBookmark({
        url,
        title: title.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        categories: categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      });
      setUrl('');
      setTitle('');
      setSourceUrl('');
      setCategories(selectedCategory !== 'All' ? selectedCategory : '');
      onAddBookmark();
      onClose();
    } catch (err) {
      console.error('Failed to load image:', err);
      setError('Failed to load image. Please check the URL and try again.');
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
            onChange={(e) => setUrl(e.target.value)}
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
            onChange={(e) => setSourceUrl(e.target.value)}
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
            onChange={(e) => setTitle(e.target.value)}
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
            onChange={(e) => setCategories(e.target.value)}
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
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isSubmitting || !url.trim()
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
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isSubmitting
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
