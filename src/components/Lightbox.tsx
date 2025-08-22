import { useEffect } from 'react';
import type { ImageBookmark } from '../types';
import { formatDate } from '../utils/validation';

interface LightboxProps {
  bookmarks: ImageBookmark[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({
  bookmarks,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const currentBookmark = bookmarks[currentIndex];

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
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <a
            href={currentBookmark.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={currentBookmark.url}
              alt={currentBookmark.title || 'Bookmarked image'}
              className="max-w-full max-h-[70vh] object-contain cursor-zoom-in"
            />
          </a>
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
        </div>
      </div>
    </div>
  );
}
