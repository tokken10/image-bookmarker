import { useState } from 'react';
import type { ImageBookmark } from '../types';

interface BulkEditModalProps {
  selectedCount: number;
  allCategories: string[];
  onClose: () => void;
  onSave: (updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>>) => void;
}

export default function BulkEditModal({
  selectedCount,
  allCategories,
  onClose,
  onSave,
}: BulkEditModalProps) {
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [applyTitle, setApplyTitle] = useState(false);
  const [applyCategories, setApplyCategories] = useState(false);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setNewCategory('');
  };

  const handleSave = () => {
    const updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>> = {};

    if (applyTitle) {
      updates.title = title.trim() || undefined;
    }

    if (applyCategories) {
      updates.categories = categories.length > 0 ? categories : undefined;
    }

    onSave(updates);
  };

  const isSaveDisabled = !applyTitle && !applyCategories;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit selected bookmarks"
    >
      <div
        className="bg-gray-800 text-white p-4 rounded w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium mb-2">Edit {selectedCount} selected</h2>
        <p className="text-sm text-gray-300 mb-4">
          Apply the same title or categories to all selected bookmarks.
        </p>
        <div className="mb-4">
          <label className="flex items-center gap-2 mb-1 text-sm">
            <input
              type="checkbox"
              checked={applyTitle}
              onChange={(event) => setApplyTitle(event.target.checked)}
            />
            Apply title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            placeholder="New title"
            disabled={!applyTitle}
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2 mb-2 text-sm">
            <input
              type="checkbox"
              checked={applyCategories}
              onChange={(event) => setApplyCategories(event.target.checked)}
            />
            Apply categories
          </label>
          <div className={`flex flex-wrap gap-2 mb-2 ${applyCategories ? '' : 'opacity-50'}`}>
            {[...new Set([...allCategories, ...categories])].map((cat) => (
              <label key={cat} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="mr-1"
                  disabled={!applyCategories}
                />
                {cat}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="New category"
              className="p-1 rounded bg-gray-700 text-white border border-gray-600 flex-1"
              disabled={!applyCategories}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              disabled={!applyCategories}
            >
              Add
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className={`px-3 py-1 rounded text-sm ${
              isSaveDisabled
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isSaveDisabled}
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
