import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { loadBookmarks, removeBookmark } from '../lib/storage';
import { formatDate } from '../utils/validation';

interface GalleryProps {
  onImageClick: (index: number) => void;
  refreshTrigger: number;
}

export default function Gallery({ onImageClick, refreshTrigger }: GalleryProps) {
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoId, setShowInfoId] = useState<string | null>(null);

  useEffect(() => {
    const savedBookmarks = loadBookmarks();
    setBookmarks(savedBookmarks);
    setIsLoading(false);
  }, [refreshTrigger]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this bookmark?')) {
      removeBookmark(id);
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No bookmarks yet</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add an image URL to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {bookmarks.map((bookmark, index) => {
          const isInfoVisible = showInfoId === bookmark.id;

          return (
            <div
              key={bookmark.id}
              onClick={() => onImageClick(index)}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg cursor-pointer bg-gray-100 dark:bg-gray-800 transition-all duration-200 hover:scale-105 hover:z-10"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onImageClick(index);
                }
              }}
            >
              <div className="relative w-full h-full">
                <img
                  src={bookmark.url}
                  alt={bookmark.title || 'Bookmarked image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e9f2f9c5f%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A40pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e9f2f9c5f%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22285.921875%22%20y%3D%22317.7%22%3EFailed%20to%20load%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                  }}
                />

                {isInfoVisible && (
                  <div className="absolute inset-0 bg-black/60 flex items-end p-2">
                    <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <h3 className="font-medium truncate">{bookmark.title || 'Untitled'}</h3>
                      <p className="text-xs opacity-80">{formatDate(bookmark.createdAt)}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoId(isInfoVisible ? null : bookmark.id);
                  }}
                  className="absolute bottom-2 left-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
                  aria-label="Toggle info"
                  title="Toggle info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                  </svg>
                </button>

                <button
                  onClick={(e) => handleRemove(e, bookmark.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                  aria-label="Remove bookmark"
                  title="Remove bookmark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
