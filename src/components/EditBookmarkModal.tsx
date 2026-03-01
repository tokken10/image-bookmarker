import { useState } from 'react';
import type { ImageBookmark } from '../types';
import { isVideoBookmark } from '../utils/validation';

interface EditBookmarkModalProps {
  bookmark: ImageBookmark;
  allCategories: string[];
  onClose: () => void;
  onSave: (
    updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>>
  ) => Promise<void>;
}

export default function EditBookmarkModal({ bookmark, allCategories, onClose, onSave }: EditBookmarkModalProps) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [categories, setCategories] = useState<string[]>(bookmark.categories || []);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVideo = isVideoBookmark(bookmark);

  const toggleCategory = (category: string) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setNewCategory('');
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const trimmedTitle = title.trim();
      await onSave({
        title: trimmedTitle || undefined,
        categories: categories.length > 0 ? categories : undefined,
      });
    } catch (saveError) {
      console.error('Failed to update bookmark:', saveError);
      setError('Failed to update bookmark. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit bookmark"
    >
      <div
        className="bg-gray-800 text-white p-4 rounded w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={bookmark.url}
            controls
            playsInline
            className="mb-4 w-full max-h-64 rounded"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={bookmark.url}
            alt={bookmark.title || 'Bookmark image'}
            className="mb-4 w-full max-h-64 object-contain rounded"
          />
        )}
        <h2 className="text-lg font-medium mb-4">Edit Bookmark</h2>
        <div className="mb-4">
          <label className="block mb-1 text-sm" htmlFor="bookmark-title">Title</label>
          <input
            id="bookmark-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            disabled={isSaving}
          />
        </div>
        <div className="mb-4">
          <p className="mb-2 text-sm">Categories</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {[...new Set([...allCategories, ...categories])].map((category) => (
              <label key={category} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="mr-1"
                  disabled={isSaving}
                />
                {category}
              </label>
            ))}
          </div>
          <div>
            <input
              type="text"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="New category"
              className="p-1 rounded bg-gray-700 text-white border border-gray-600"
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              disabled={isSaving}
            >
              Add
            </button>
          </div>
        </div>

        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => void handleSave()}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:bg-blue-400"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
