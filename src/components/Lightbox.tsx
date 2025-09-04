import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { formatDate } from '../utils/validation';
import EditBookmarkModal from './EditBookmarkModal';

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
  const [showInfo, setShowInfo] = useState(false);
  const [editing, setEditing] = useState(false);

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

  const truncate = (str: string, length = 30) =>
    str.length > length ? `${str.slice(0, length)}...` : str;

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch((err) =>
      console.error('Failed to copy:', err)
    );
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

        {/* Info button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
          className="absolute -top-10 left-0 p-2 bg-black/50 text-white hover:bg-black/70 hover:text-gray-300 rounded"
          aria-label="Show info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
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

        {/* Basic info */}
        <div className="mt-4 text-white text-center">
          {currentBookmark.title && (
            <h3 className="text-xl font-medium mb-1">{currentBookmark.title}</h3>
          )}
          <p className="text-sm text-gray-300">
            {currentIndex + 1} of {bookmarks.length}
          </p>
        </div>
      </div>

      {showInfo && (
        <div
          className="absolute inset-0 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image information"
        >
          <div
            className="bg-gray-800 text-white p-4 rounded w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-4">Image Info</h2>
            <div className="mb-2 flex items-center">
              <span className="mr-2 font-medium">Title:</span>
              <span className="mr-2">{truncate(currentBookmark.title || '')}</span>
              <button
                onClick={() => copyToClipboard(currentBookmark.title || '')}
                className="p-1 bg-black/30 rounded hover:bg-black/50"
                aria-label="Copy title"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
                </svg>
              </button>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 font-medium">URL:</span>
              <span className="mr-2">{truncate(currentBookmark.url)}</span>
              <button
                onClick={() => copyToClipboard(currentBookmark.url)}
                className="p-1 bg-black/30 rounded hover:bg-black/50"
                aria-label="Copy URL"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
                </svg>
              </button>
            </div>
            <p className="mb-2 text-sm">Date: {formatDate(currentBookmark.createdAt)}</p>
            <p className="mb-4 text-sm">
              Categories: {currentBookmark.categories?.join(', ') || 'None'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowInfo(false);
                  setEditing(true);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditBookmarkModal
          bookmark={currentBookmark}
          allCategories={allCategories}
          onClose={() => setEditing(false)}
          onSave={(updated) => {
            onUpdateBookmark(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
