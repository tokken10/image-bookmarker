import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { ImageBookmark } from '../types';
import { isVideoBookmark } from '../utils/validation';

interface LightboxProps {
  bookmarks: ImageBookmark[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (value: number) => void;
}

export default function Lightbox({
  bookmarks,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  overlayOpacity,
  onOverlayOpacityChange,
}: LightboxProps) {
  const currentBookmark = bookmarks[currentIndex];
  const isVideo = currentBookmark ? isVideoBookmark(currentBookmark) : false;

  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOpacityControls, setShowOpacityControls] = useState(false);
  const [hideChrome, setHideChrome] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!currentBookmark) return null;

  const handleToggleFullscreen = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const mediaElement = (isVideo ? videoRef.current : imageRef.current) as Element | null;
    if (!mediaElement) return;

    try {
      if (!document.fullscreenElement) {
        await mediaElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors (browser policy or unsupported).
    }
  };

  const title = currentBookmark.title;
  const hasInfo = Boolean(title);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
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
            setHideChrome((prev) => {
              const next = !prev;
              if (next) {
                setShowOpacityControls(false);
              }
              return next;
            });
          }}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
          aria-label={hideChrome ? 'Show controls' : 'Hide controls'}
          aria-pressed={hideChrome}
        >
          {hideChrome ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
              <path d="M4 4l16 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {!hideChrome && (
          <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying((prev) => !prev);
          }}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleToggleFullscreen}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
          aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo((prev) => !prev);
          }}
          disabled={!hasInfo}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full disabled:opacity-50"
          aria-label={showInfo ? 'Hide info' : 'Show info'}
          aria-pressed={showInfo}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6M12 7h.01" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOpacityControls((prev) => !prev);
          }}
          className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
          aria-label="Adjust background opacity"
          aria-pressed={showOpacityControls}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 2a7 7 0 010 14V5z" />
          </svg>
        </button>

        <button
          onClick={onClose}
          className="p-2 bg-black/50 text-white hover:bg-black/70 hover:text-gray-300 focus:outline-none rounded-full"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
          </>
        )}
      </div>

      {showOpacityControls && !hideChrome && (
        <div
          className="absolute top-16 right-4 w-56 rounded-xl bg-black/70 text-white p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-300 mb-2">
            <span>Overlay</span>
            <span>{Math.round(overlayOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => onOverlayOpacityChange(Number(e.target.value))}
            className="w-full accent-white"
            aria-label="Overlay opacity"
          />
        </div>
      )}

      {/* Navigation buttons */}
      {!hideChrome && (
        <>
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
        </>
      )}

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative inline-flex">
          {isVideo ? (
            <video
              src={currentBookmark.url}
              controls
              playsInline
              ref={videoRef}
              className={`max-h-[70vh] w-full max-w-full ${isFullscreen ? 'max-h-screen max-w-screen' : ''}`}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={currentBookmark.url}
              alt={currentBookmark.title || 'Bookmarked image'}
              ref={imageRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed((z) => !z);
              }}
              className={`max-w-full max-h-[70vh] object-contain transition-transform duration-300 origin-center ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              } ${isFullscreen ? 'max-h-screen max-w-screen' : ''}`}
            />
          )}

            {!isZoomed && !hideChrome && (
              <p className="absolute left-0 -bottom-7 text-sm text-gray-300">
                {currentIndex + 1} of {bookmarks.length}
              </p>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="mt-8 text-white text-center">
          {!hideChrome && showInfo && hasInfo && (
            <div className="inline-flex flex-col items-center gap-3">
              {title && (
                <div className="inline-flex items-center gap-2">
                  <h3 className="text-xl font-medium">{title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (title) {
                        window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(title)}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }
                    }}
                    className="p-1.5 bg-black/50 text-white hover:bg-black/70 rounded-full"
                    aria-label="Search title on Google"
                    title="Search title on Google"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="11" cy="11" r="8" strokeWidth={2} />
                      <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (title && navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(title);
                      }
                    }}
                    className="p-1.5 bg-black/50 text-white hover:bg-black/70 rounded-full"
                    aria-label="Copy title"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h10v10H8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
