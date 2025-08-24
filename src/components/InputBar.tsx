import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { isValidImageUrl } from '../utils/validation';
import { addBookmark } from '../lib/storage';

interface InputBarProps {
  onAddBookmark: () => void;
}

export default function InputBar({ onAddBookmark }: InputBarProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setPreviewError('');

    if (isValidImageUrl(value)) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
      addBookmark({ url, title: title.trim() || undefined });
      setUrl('');
      setTitle('');
      setPreviewUrl(null);
      setPreviewError('');
      onAddBookmark();
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
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
            required
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

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

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
      </form>

      {previewError && (
        <p className="text-red-500 text-sm mt-1">{previewError}</p>
      )}

      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt={title ? `Preview of ${title}` : 'Image preview'}
            className="max-h-48 object-contain"
            onLoad={() => setPreviewError('')}
            onError={() => {
              setPreviewError('Failed to load preview');
              setPreviewUrl(null);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              setPreviewError('');
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Clear preview
          </button>
        </div>
      )}
    </div>
  );
}
