import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { isVideoBookmark } from '../utils/validation';

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
  const isVideo = currentBookmark ? isVideoBookmark(currentBookmark) : false;

  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isVideo) {
      setIsZoomed(false);
    }
  }, [isVideo]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, onNext]);

  useEffect(() => {
    if (isPlaying && currentIndex === bookmarks.length - 1) {
      setIsPlaying(false);
    }
  }, [currentIndex, bookmarks.length, isPlaying]);

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
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(true);
          }}
          disabled={isPlaying}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full disabled:opacity-50"
          aria-label="Play slideshow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(false);
          }}
          disabled={!isPlaying}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full disabled:opacity-50"
          aria-label="Pause slideshow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        </button>

        <button
          onClick={onClose}
          className="p-2 bg-black/50 text-white hover:bg-black/70 hover:text-gray-300 focus:outline-none rounded-full"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white hover:bg-black/70 rounded-full transition-colors disabled:opacity-40"
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
        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 text-white hover:bg-black/70 rounded-full transition-colors disabled:opacity-40"
        disabled={currentIndex === bookmarks.length - 1}
        aria-label="Next image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative inline-flex">
          {isVideo ? (
            <video
              src={currentBookmark.url}
              controls
              playsInline
              className="max-h-[70vh] w-full max-w-full"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
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
          )}

            <p className="absolute left-0 -bottom-7 text-sm text-gray-300">
              {currentIndex + 1} of {bookmarks.length}
            </p>
          </div>
        </div>

        {/* Basic info */}
        <div className="mt-4 text-white text-center">
          {currentBookmark.title && (
            <h3 className="text-xl font-medium mb-1">{currentBookmark.title}</h3>
          )}
        </div>

      </div>

    </div>
  );
}
