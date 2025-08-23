import { useEffect, useState } from 'react';
import type { ImageBookmark } from '../types';
import { addBookmark, loadBookmarks, removeBookmark } from '../lib/storage';
import { formatDate, isValidImageUrl } from '../utils/validation';
import { filterBookmarks } from '../utils/filterBookmarks';

interface GalleryProps {
  onImageClick: (index: number) => void;
  refreshTrigger: number;
  onAddBookmark: () => void;
  searchQuery: string;
}

export default function Gallery({ onImageClick, refreshTrigger, onAddBookmark, searchQuery }: GalleryProps) {
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoVisibleId, setInfoVisibleId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    const newItems: ImageBookmark[] = [];

    if (droppedUrl && isValidImageUrl(droppedUrl)) {
      const bookmark = addBookmark({ url: droppedUrl });
      newItems.push(bookmark);
    }

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const bookmark = addBookmark({ url: dataUrl, title: file.name });
      newItems.push(bookmark);
    }

    if (newItems.length > 0) {
      setBookmarks(prev => [...newItems, ...prev]);
      onAddBookmark();
    }
  };

  const filteredBookmarks = filterBookmarks(bookmarks, searchQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="relative container mx-auto px-4 py-8"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 border-4 border-dashed border-blue-500 flex items-center justify-center text-gray-700 dark:text-gray-300 z-20">
          Drop images here
        </div>
      )}

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {bookmarks.length === 0 ? 'No bookmarks yet' : 'No bookmarks found'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Add an image URL or drag and drop an image to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredBookmarks.map((bookmark) => {
            const originalIndex = bookmarks.findIndex(b => b.id === bookmark.id);
            return (
              <div
                key={bookmark.id}
                onClick={() => onImageClick(originalIndex)}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-200 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:z-10 hover:scale-105"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onImageClick(originalIndex);
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

                  <div
                    className={`absolute inset-0 bg-black/60 flex items-end p-2 transition-opacity duration-200 z-10 ${infoVisibleId === bookmark.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <h3 className="font-medium truncate">{bookmark.title || 'Untitled'}</h3>
                      <p className="text-xs opacity-80">{formatDate(bookmark.createdAt)}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoVisibleId(prev => (prev === bookmark.id ? null : bookmark.id));
                    }}
                    className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Show info"
                    title="Show info"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => handleRemove(e, bookmark.id)}
                    className={`absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full transition-opacity z-20 hover:bg-red-600 ${infoVisibleId === bookmark.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
      )}
    </div>
  );
}
