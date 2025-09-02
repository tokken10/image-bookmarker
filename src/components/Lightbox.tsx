import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { formatDate } from '../utils/validation';
import { updateBookmark } from '../lib/storage';

interface LightboxProps {
  bookmarks: ImageBookmark[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateBookmark: (bookmark: ImageBookmark) => void;
  allCategories: string[];
}

export default function Lightbox({
  bookmarks,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onUpdateBookmark,
  allCategories,
}: LightboxProps) {
  const currentBookmark = bookmarks[currentIndex];

  const [isZoomed, setIsZoomed] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!currentBookmark) return null;

  const handleEdit = () => {
    const newTitle = window.prompt(
      'Enter a title for this image',
      currentBookmark.title || ''
    );
    if (newTitle === null) return;

    const trimmed = newTitle.trim();
    const updated = updateBookmark(currentBookmark.id, {
      title: trimmed || undefined,
    });
    if (updated) {
      onUpdateBookmark(updated);
    }
  };

  const handleStartEditCategories = () => {
    setTempCategories(currentBookmark.categories || []);
    setNewCategory('');
    setEditingCategories(true);
  };

  const handleToggleCategory = (category: string) => {
    setTempCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !tempCategories.includes(trimmed)) {
      setTempCategories((prev) => [...prev, trimmed]);
    }
    setNewCategory('');
  };

  const handleSaveCategories = () => {
    const updated = updateBookmark(currentBookmark.id, {
      categories: tempCategories.length > 0 ? tempCategories : undefined,
    });
    if (updated) {
      onUpdateBookmark(updated);
    }
    setEditingCategories(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
      onClick={(e) => {
        // Close if clicking on the backdrop (not the image or controls)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 bg-black/50 text-white hover:bg-black/70 hover:text-gray-300 focus:outline-none rounded"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={currentBookmark.url}
            alt={currentBookmark.title || 'Bookmarked image'}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed((z) => !z);
            }}
            className={`max-w-full max-h-[70vh] object-contain transition-transform duration-300 origin-center ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          />
        </div>

        {/* Navigation buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white hover:bg-black/70 rounded-r-lg transition-colors"
          disabled={currentIndex === 0}
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white hover:bg-black/70 rounded-l-lg transition-colors"
          disabled={currentIndex === bookmarks.length - 1}
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Image info */}
        <div className="mt-4 text-white text-center">
          {currentBookmark.title && (
            <h3 className="text-xl font-medium mb-1">{currentBookmark.title}</h3>
          )}
          <p className="text-sm text-gray-300">
            {formatDate(currentBookmark.createdAt)}
            {' • '}
            {currentIndex + 1} of {bookmarks.length}
          </p>
          <a
            href={currentBookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-sm text-blue-300 hover:underline break-all"
          >
            {currentBookmark.url}
          </a>
          {editingCategories ? (
            <div className="text-sm text-gray-300 mt-1">
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {[...new Set([...allCategories, ...tempCategories])].map((cat) => (
                  <label key={cat} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={tempCategories.includes(cat)}
                      onChange={() => handleToggleCategory(cat)}
                      className="mr-1"
                    />
                    {cat}
                  </label>
                ))}
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category"
                  className="p-1 rounded bg-gray-800 text-white border border-gray-600"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Add
                </button>
              </div>
              <div className="space-x-2">
                <button
                  onClick={handleSaveCategories}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingCategories(false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-300 mt-1">
                Categories: {currentBookmark.categories?.join(', ') || 'None'}
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Edit title
                </button>
                <button
                  onClick={handleStartEditCategories}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Edit categories
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
