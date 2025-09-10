import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ImageBookmark } from '../types';
import { addBookmark, loadBookmarks, removeBookmark, removeBookmarks } from '../lib/storage';
import { formatDate, isValidImageUrl } from '../utils/validation';
import { searchImages } from '../utils/search';
import EditBookmarkModal from './EditBookmarkModal';

interface GalleryProps {
  onImageClick: (index: number, items: ImageBookmark[]) => void;
  refreshTrigger: number;
  onAddBookmark: () => void;
  selectedCategory: string;
  selectMode: boolean;
  setSelectMode: Dispatch<SetStateAction<boolean>>;
  showSearch: boolean;
  setShowSearch: Dispatch<SetStateAction<boolean>>;
}

export default function Gallery({
  onImageClick,
  refreshTrigger,
  onAddBookmark,
  selectedCategory,
  selectMode,
  setSelectMode,
  showSearch,
  setShowSearch,
}: GalleryProps) {
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoVisibleId, setInfoVisibleId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<ImageBookmark | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const savedBookmarks = loadBookmarks();
    setBookmarks(savedBookmarks);
    setIsLoading(false);
  }, [refreshTrigger]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach(b => {
      b.categories?.forEach(cat => set.add(cat));
    });
    return Array.from(set);
  }, [bookmarks]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this bookmark?')) {
      removeBookmark(id);
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
      onAddBookmark();
    }
  };

  useEffect(() => {
    if (!selectMode) {
      setSelectedIds([]);
      setInfoVisibleId(null);
    }
  }, [selectMode]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Delete ${selectedIds.length} selected image${
          selectedIds.length === 1 ? '' : 's'
        }?`
      )
    ) {
      removeBookmarks(selectedIds);
      setBookmarks(bookmarks.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      setSelectMode(false);
      onAddBookmark();
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
      const bookmark = addBookmark({
        url: droppedUrl,
        categories: selectedCategory !== 'All' ? [selectedCategory] : undefined,
      });
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
      const bookmark = addBookmark({
        url: dataUrl,
        title: file.name,
        categories: selectedCategory !== 'All' ? [selectedCategory] : undefined,
      });
      newItems.push(bookmark);
    }

    if (newItems.length > 0) {
      setBookmarks(prev => [...newItems, ...prev]);
      onAddBookmark();
    }
  };

  const filteredByCategory = selectedCategory === 'All'
    ? bookmarks
    : bookmarks.filter(b => b.categories?.includes(selectedCategory));

  const searchResults = useMemo(
    () => searchImages(filteredByCategory, debouncedSearch),
    [filteredByCategory, debouncedSearch]
  );

  const displayedBookmarks = searchResults.map((r) => r.bookmark);

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

      {bookmarks.length > 0 && (
        <>

          {showSearch && (
            <div className="mb-4">

              <div className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearch('');
                  }}
                  placeholder="Search images..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setShowSearch(false);
                  }}
                  className="px-3 py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {selectMode && (
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className={`px-3 py-1 rounded-md text-white font-medium ${
                  selectedIds.length === 0
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors`}
              >
                Delete Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectMode(false)}
                className="px-3 py-1 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No bookmarks yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Add an image URL or drag and drop an image to get started!
          </p>
        </div>
      ) : displayedBookmarks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {debouncedSearch ? 'No results' : 'No bookmarks in this category'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayedBookmarks.map((bookmark, index) => {
            const isSelected = selectedIds.includes(bookmark.id);
            return (
              <div
                key={bookmark.id}
                onClick={() =>
                  selectMode
                    ? toggleSelection(bookmark.id)
                    : onImageClick(index, displayedBookmarks)
                }
                className={`group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-200 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:z-10 hover:scale-105 ${
                  isSelected ? 'ring-4 ring-blue-500' : ''
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (selectMode) {
                      toggleSelection(bookmark.id);
                    } else {
                      onImageClick(index, displayedBookmarks);
                    }
                  }
                }}
              >
                <div className="relative w-full h-full">
                  {selectMode && (
                    <div className="absolute top-2 left-2 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(bookmark.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </div>
                  )}
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

                  {!selectMode && (
                    <>
                      <div
                        className={`absolute inset-0 bg-black/60 flex items-end p-2 transition-opacity duration-200 z-10 ${
                          infoVisibleId === bookmark.id
                            ? 'opacity-100'
                            : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                          <div className="flex items-start">
                            <h3 className="font-medium flex-1 max-w-[75%] truncate">


                              {bookmark.title || 'Untitled'}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void navigator.clipboard.writeText(
                                  bookmark.title || 'Untitled'
                                );
                              }}
                              className="ml-2 p-1 hover:text-blue-300"
                              aria-label="Copy title"
                              title="Copy title"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="12"
                                  height="12"
                                  rx="2"
                                  ry="2"
                                  strokeWidth={2}
                                />
                                <rect
                                  x="3"
                                  y="3"
                                  width="12"
                                  height="12"
                                  rx="2"
                                  ry="2"
                                  strokeWidth={2}
                                />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs opacity-80">{formatDate(bookmark.createdAt)}</p>
                          <div className="flex items-start mt-1">
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-300 hover:underline flex-1 max-w-[75%] break-all"


                            >
                              {bookmark.url}
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void navigator.clipboard.writeText(bookmark.url);
                              }}
                              className="ml-2 p-1 text-white hover:text-blue-300"
                              aria-label="Copy URL"
                              title="Copy URL"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="12"
                                  height="12"
                                  rx="2"
                                  ry="2"
                                  strokeWidth={2}
                                />
                                <rect
                                  x="3"
                                  y="3"
                                  width="12"
                                  height="12"
                                  rx="2"
                                  ry="2"
                                  strokeWidth={2}
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoVisibleId(prev => (prev === bookmark.id ? null : bookmark.id));
                        }}
                        className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        aria-label="Show info"
                        title="Show info"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBookmark(bookmark);
                          setInfoVisibleId(null);
                        }}
                        className={`absolute top-2 right-10 p-1.5 bg-blue-500 text-white rounded-full transition-opacity z-20 hover:bg-blue-600 ${
                          infoVisibleId === bookmark.id
                            ? 'opacity-100'
                            : 'opacity-0 pointer-events-none'
                        }`}
                        aria-label="Edit bookmark"
                        title="Edit bookmark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.768 3.768a2 2 0 112.828 2.828L7 19.5 3 21l1.5-4L16.768 3.768z" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => handleRemove(e, bookmark.id)}
                        className={`absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full transition-opacity z-20 hover:bg-red-600 ${
                          infoVisibleId === bookmark.id
                            ? 'opacity-100'
                            : 'opacity-0 pointer-events-none'
                        }`}
                        aria-label="Remove bookmark"
                        title="Remove bookmark"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          allCategories={allCategories}
          onClose={() => setEditingBookmark(null)}
          onSave={(updated) => {
            setBookmarks(prev =>
              prev.map(b => (b.id === updated.id ? updated : b))
            );
            setEditingBookmark(null);
            onAddBookmark();
          }}
        />
      )}
    </div>
  );
}
