import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ImageBookmark } from '../types';
import {
  addBookmark,
  isDuplicateUrl,
  loadBookmarks,
  moveBookmarkToFrontByUrl,
  normalizeBookmarkUrl,
  removeBookmark,
  removeBookmarks,
  updateBookmarksBulk,
} from '../lib/storage';
import { formatDate, isValidImageUrl, isVideoBookmark } from '../utils/validation';
import { searchImages } from '../utils/search';
import BulkEditModal from './BulkEditModal';
import EditBookmarkModal from './EditBookmarkModal';

type SupportedMedia = {
  mimeType: string;
  mediaType: 'image' | 'video';
};

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

const MIME_TYPE_LOOKUP: Record<string, SupportedMedia> = {
  'image/jpeg': { mimeType: 'image/jpeg', mediaType: 'image' },
  'image/png': { mimeType: 'image/png', mediaType: 'image' },
  'image/gif': { mimeType: 'image/gif', mediaType: 'image' },
  'image/webp': { mimeType: 'image/webp', mediaType: 'image' },
  'video/mp4': { mimeType: 'video/mp4', mediaType: 'video' },
  'video/quicktime': { mimeType: 'video/quicktime', mediaType: 'video' },
  'video/webm': { mimeType: 'video/webm', mediaType: 'video' },
};

const EXTENSION_LOOKUP: Record<string, SupportedMedia> = {
  jpg: MIME_TYPE_LOOKUP['image/jpeg'],
  jpeg: MIME_TYPE_LOOKUP['image/jpeg'],
  png: MIME_TYPE_LOOKUP['image/png'],
  gif: MIME_TYPE_LOOKUP['image/gif'],
  webp: MIME_TYPE_LOOKUP['image/webp'],
  mp4: MIME_TYPE_LOOKUP['video/mp4'],
  mov: MIME_TYPE_LOOKUP['video/quicktime'],
  webm: MIME_TYPE_LOOKUP['video/webm'],
};

const getFileInfo = (file: File): SupportedMedia | null => {
  const type = file.type?.toLowerCase();
  if (type && MIME_TYPE_LOOKUP[type]) {
    return MIME_TYPE_LOOKUP[type];
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && EXTENSION_LOOKUP[extension]) {
    return EXTENSION_LOOKUP[extension];
  }
  return null;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;
type ItemsPerPageOption = (typeof ITEMS_PER_PAGE_OPTIONS)[number];
const DEFAULT_ITEMS_PER_PAGE: ItemsPerPageOption = 24;
const ITEMS_PER_PAGE_STORAGE_KEY = 'imageBookmarks:itemsPerPage:v1';

interface GalleryProps {
  onImageClick: (index: number, items: ImageBookmark[]) => void;
  refreshTrigger: number;
  onAddBookmark: () => void;
  selectedCategories: string[];
  selectMode: boolean;
  setSelectMode: Dispatch<SetStateAction<boolean>>;
  showSearch: boolean;
  setShowSearch: Dispatch<SetStateAction<boolean>>;
  showDuplicatesOnly: boolean;
}

export default function Gallery({
  onImageClick,
  refreshTrigger,
  onAddBookmark,
  selectedCategories,
  selectMode,
  setSelectMode,
  showSearch,
  setShowSearch,
  showDuplicatesOnly,
}: GalleryProps) {
  const PAGINATION_STATE_KEY = 'imageBookmarks:paginationState:v1';
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [infoVisibleId, setInfoVisibleId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<ImageBookmark | null>(null);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropError, setDropError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPageOption>(
    DEFAULT_ITEMS_PER_PAGE
  );
  const lastSelectedIndexRef = useRef<number | null>(null);

  const paginationKey = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return `${selectedCategories.join(',')}::${normalizedSearch}`;
  }, [selectedCategories, debouncedSearch]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ITEMS_PER_PAGE_STORAGE_KEY);
      if (stored) {
        const parsed = Number.parseInt(stored, 10);
        if (ITEMS_PER_PAGE_OPTIONS.includes(parsed as ItemsPerPageOption)) {
          setItemsPerPage(parsed as ItemsPerPageOption);
        }
      }
    } catch (error) {
      console.error('Failed to load items-per-page preference:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_PER_PAGE_STORAGE_KEY, String(itemsPerPage));
    } catch (error) {
      console.error('Failed to save items-per-page preference:', error);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const savedBookmarks = loadBookmarks();
    setBookmarks(savedBookmarks);
    setIsLoading(false);
  }, [refreshTrigger]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGINATION_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number>;
        const savedPage = parsed[paginationKey];
        if (typeof savedPage === 'number' && savedPage >= 1) {
          setCurrentPage(savedPage);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load pagination state:', error);
    }
    setCurrentPage(1);
  }, [paginationKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGINATION_STATE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Record<string, number>) : {};
      if (parsed[paginationKey] !== currentPage) {
        parsed[paginationKey] = currentPage;
        localStorage.setItem(PAGINATION_STATE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to save pagination state:', error);
    }
  }, [paginationKey, currentPage]);

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
      setBulkEditing(false);
      lastSelectedIndexRef.current = null;
    }
  }, [selectMode]);

  useEffect(() => {
    lastSelectedIndexRef.current = null;
  }, [currentPage, paginationKey]);

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

  const handleBulkEditSave = (
    updates: Partial<Omit<ImageBookmark, 'id' | 'createdAt' | 'searchTokens'>>
  ) => {
    if (selectedIds.length === 0) return;
    if (!('title' in updates) && !('categories' in updates)) return;

    const updatedBookmarks = updateBookmarksBulk(selectedIds, updates);
    setBookmarks(updatedBookmarks);
    setSelectedIds([]);
    setSelectMode(false);
    setBulkEditing(false);
    onAddBookmark();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDropError(null);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setDropError(null);

    const droppedUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    const newItems: ImageBookmark[] = [];
    const errors: string[] = [];
    let movedExisting = false;

    if (droppedUrl && isValidImageUrl(droppedUrl)) {
      if (isDuplicateUrl(droppedUrl)) {
        const reordered = moveBookmarkToFrontByUrl(droppedUrl);
        if (reordered) {
          setBookmarks(reordered);
          movedExisting = true;
        }
        errors.push('This image is already in your bookmarks.');
      } else {
        const bookmark = addBookmark({
          url: droppedUrl,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });
        newItems.push(bookmark);
      }
    }

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const info = getFileInfo(file);
      if (!info) {
        errors.push(`${file.name} is not a supported file type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name} exceeds the 30 MB file size limit.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (isDuplicateUrl(dataUrl)) {
          const reordered = moveBookmarkToFrontByUrl(dataUrl);
          if (reordered) {
            setBookmarks(reordered);
            movedExisting = true;
          }
          errors.push(`${file.name} is already in your bookmarks.`);
          continue;
        }
        const bookmark = addBookmark({
          url: dataUrl,
          title: file.name,
          mimeType: info.mimeType,
          mediaType: info.mediaType,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });
        newItems.push(bookmark);
      } catch (error) {
        console.error('Failed to read file:', error);
        errors.push(`Something went wrong while reading ${file.name}.`);
      }
    }

    if (newItems.length > 0) {
      setBookmarks(prev => [...newItems, ...prev]);
      onAddBookmark();
    }

    if (movedExisting) {
      onAddBookmark();
    }

    if (errors.length > 0) {
      setDropError(errors.join(' '));
    }
  };

  const duplicateIdSet = useMemo(() => {
    const map = new Map<string, ImageBookmark[]>();

    bookmarks.forEach((bookmark) => {
      const key = normalizeBookmarkUrl(bookmark.url);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(bookmark);
    });

    const duplicates = new Set<string>();
    map.forEach((items) => {
      if (items.length > 1) {
        items.forEach((item) => duplicates.add(item.id));
      }
    });

    return duplicates;
  }, [bookmarks]);

  const filteredByCategory = useMemo(() => (
    selectedCategories.length === 0
      ? bookmarks
      : bookmarks.filter((bookmark) =>
        selectedCategories.every((category) => bookmark.categories?.includes(category))
      )
  ), [bookmarks, selectedCategories]);

  const filteredBookmarks = useMemo(() => (
    showDuplicatesOnly
      ? filteredByCategory.filter((bookmark) => duplicateIdSet.has(bookmark.id))
      : filteredByCategory
  ), [filteredByCategory, showDuplicatesOnly, duplicateIdSet]);

  const searchResults = useMemo(
    () => searchImages(filteredBookmarks, debouncedSearch),
    [filteredBookmarks, debouncedSearch]
  );

  const displayedBookmarks = searchResults.map((r) => r.bookmark);

  const totalBookmarks = displayedBookmarks.length;
  const totalPages = Math.max(1, Math.ceil(totalBookmarks / itemsPerPage));

  useEffect(() => {
    setCurrentPage(prev => {
      const safePage = Math.min(Math.max(prev, 1), totalPages);
      return safePage === prev ? prev : safePage;
    });
  }, [totalPages]);

  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedBookmarks.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedBookmarks, currentPage, itemsPerPage]);

  const toggleSelection = useCallback(
    (id: string, index: number, shiftKey: boolean) => {
      setSelectedIds(prev => {
        if (shiftKey && lastSelectedIndexRef.current !== null) {
          const start = Math.min(lastSelectedIndexRef.current, index);
          const end = Math.max(lastSelectedIndexRef.current, index);
          const next = new Set(prev);
          paginatedBookmarks
            .slice(start, end + 1)
            .forEach(bookmark => next.add(bookmark.id));
          return Array.from(next);
        }

        return prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      });

      lastSelectedIndexRef.current = index;
    },
    [paginatedBookmarks]
  );

  const createPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | string> = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) {
      pages.push('left-ellipsis');
    }

    for (let page = left; page <= right; page += 1) {
      pages.push(page);
    }

    if (right < totalPages - 1) {
      pages.push('right-ellipsis');
    }

    pages.push(totalPages);

    return pages;
  };

  const startIndex = totalBookmarks === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalBookmarks);

  const PaginationControls = ({
    className = '',
    showMeta = true,
  }: { className?: string; showMeta?: boolean }) => {
    if (totalBookmarks === 0) {
      return null;
    }

    const justifyContent = showMeta ? 'sm:justify-between' : 'sm:justify-end';

    return (
      <div className={`${className} flex flex-col gap-4 sm:flex-row sm:items-center ${justifyContent}`}>
        {showMeta && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {startIndex}-{endIndex} of {totalBookmarks}
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10) as ItemsPerPageOption;
                  if (ITEMS_PER_PAGE_OPTIONS.includes(value)) {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 shadow'
              }`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {createPageNumbers().map((page, index) => {
                if (typeof page === 'string') {
                  return (
                    <span
                      key={`${page}-${index}`}
                      className="px-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 shadow'
                    }`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 shadow'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

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
          Drop images, GIFs, or videos here
        </div>
      )}

      {dropError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
          {dropError}
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
                onClick={() => setBulkEditing(true)}
                disabled={selectedIds.length === 0}
                className={`px-3 py-1 rounded-md text-white font-medium ${
                  selectedIds.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                Edit Selected ({selectedIds.length})
              </button>
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
          {showDuplicatesOnly && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Showing only bookmarks that share an identical image URL with at least one other entry.
            </div>
          )}
        </>
      )}

      {totalBookmarks > 0 && <PaginationControls className="mb-4" showMeta={false} />}


      {totalBookmarks === 0 ? (


        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {debouncedSearch
              ? 'No results'
              : showDuplicatesOnly
                ? 'No duplicate bookmarks found'
                : 'No bookmarks in this category'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {paginatedBookmarks.map((bookmark, index) => {
            const isSelected = selectedIds.includes(bookmark.id);
            return (
              <div
                key={bookmark.id}
                onClick={(event) =>
                  selectMode
                    ? toggleSelection(bookmark.id, index, event.shiftKey)
                    : onImageClick(index, paginatedBookmarks)
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
                      toggleSelection(bookmark.id, index, false);
                    } else {
                      onImageClick(index, paginatedBookmarks);
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
                        onChange={(event) =>
                          toggleSelection(
                            bookmark.id,
                            index,
                            event.nativeEvent instanceof MouseEvent
                              ? event.nativeEvent.shiftKey
                              : false
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </div>
                  )}
                  {isVideoBookmark(bookmark) ? (
                    <video
                      src={bookmark.url}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
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
                  )}

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

      <PaginationControls className="mt-6 sm:mt-8" />

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
      {bulkEditing && (
        <BulkEditModal
          selectedCount={selectedIds.length}
          allCategories={allCategories}
          onClose={() => setBulkEditing(false)}
          onSave={handleBulkEditSave}
        />
      )}
    </div>
  );
}
