import { useState } from 'react';
import type { ImageBookmark } from '../types';
import { updateBookmark } from '../lib/storage';

interface EditBookmarkModalProps {
  bookmark: ImageBookmark;
  allCategories: string[];
  onClose: () => void;
  onSave: (bookmark: ImageBookmark) => void;
}

export default function EditBookmarkModal({ bookmark, allCategories, onClose, onSave }: EditBookmarkModalProps) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [categories, setCategories] = useState<string[]>(bookmark.categories || []);
  const [newCategory, setNewCategory] = useState('');

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
    }
    setNewCategory('');
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const updated = updateBookmark(bookmark.id, {
      title: trimmedTitle || undefined,
      categories: categories.length > 0 ? categories : undefined,
    });
    if (updated) {
      onSave(updated);
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
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium mb-4">Edit Bookmark</h2>
        <div className="mb-4">
          <label className="block mb-1 text-sm">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
        </div>
        <div className="mb-4">
          <p className="mb-2 text-sm">Categories</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {[...new Set([...allCategories, ...categories])].map((cat) => (
              <label key={cat} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="mr-1"
                />
                {cat}
              </label>
            ))}
          </div>
          <div>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category"
              className="p-1 rounded bg-gray-700 text-white border border-gray-600"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Add
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

