import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageBookmark } from './types';
import {
  addBookmarksFromImport,
  clearCurrentViewOrder,
  clearLegacyCustomCategories,
  clearLegacyLocalBookmarks,
  loadBookmarks,
  loadCustomCategories,
  loadLegacyCustomCategories,
  loadLegacyLocalBookmarks,
  removeCategoryFromBookmarks,
  saveCurrentViewOrder,
  saveCustomCategories,
} from './lib/storage';
import { buildBookmarksCsv, parseBookmarksCsv } from './utils/csv';
import { useAuth } from './auth/useAuth';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import InputBar from './components/InputBar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';
import CategorySelector from './components/CategorySelector';
import ScrollToTopButton from './components/ScrollToTopButton';
import ScrollToBottomButton from './components/ScrollToBottomButton';

const MIGRATION_STATE_KEY_PREFIX = 'imageBookmarks:migrationState:';

export default function App() {
  const { user, loading: authLoading, signOut, isConfigured } = useAuth();
  const userId = user?.id ?? null;
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxBookmarks, setLightboxBookmarks] = useState<ImageBookmark[]>([]);
  const [lightboxOverlayOpacity, setLightboxOverlayOpacity] = useState(0.9);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showInputBar, setShowInputBar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showUntitledOnly, setShowUntitledOnly] = useState(false);
  const [gridResetToken, setGridResetToken] = useState(0);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedBookmarksRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      return;
    }

    let isActive = true;
    if (!hasLoadedBookmarksRef.current) {
      setBookmarksLoading(true);
    }

    const load = async () => {
      try {
        const savedBookmarks = await loadBookmarks();
        if (isActive) {
          setBookmarks(savedBookmarks);
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        if (isActive) {
          hasLoadedBookmarksRef.current = true;
          setBookmarksLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [refreshTrigger, userId]);

  useEffect(() => {
    if (!userId) {
      setCustomCategories([]);
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        const loaded = await loadCustomCategories();
        if (isActive) {
          setCustomCategories(loaded);
        }
      } catch (error) {
        console.error('Failed to load custom categories:', error);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;

    const migrateLegacyData = async () => {
      const migrationStateKey = `${MIGRATION_STATE_KEY_PREFIX}${userId}`;
      const migrationState = localStorage.getItem(migrationStateKey);
      if (migrationState === 'done' || migrationState === 'in-progress') {
        return;
      }

      localStorage.setItem(migrationStateKey, 'in-progress');

      try {
        const legacyBookmarks = loadLegacyLocalBookmarks();
        const legacyCategories = loadLegacyCustomCategories();

        if (legacyBookmarks.length === 0 && legacyCategories.length === 0) {
          localStorage.setItem(migrationStateKey, 'done');
          return;
        }

        const shouldImport = window.confirm(
          `You have ${legacyBookmarks.length} local bookmark${legacyBookmarks.length === 1 ? '' : 's'} and ${legacyCategories.length} local custom categor${legacyCategories.length === 1 ? 'y' : 'ies'}. Import them to your account?`
        );

        if (!shouldImport) {
          localStorage.setItem(migrationStateKey, 'done');
          return;
        }

        let imported = 0;
        let skipped = 0;

        if (legacyBookmarks.length > 0) {
          const result = await addBookmarksFromImport(
            legacyBookmarks.map((bookmark) => ({
              url: bookmark.url,
              title: bookmark.title,
              sourceUrl: bookmark.sourceUrl,
              categories: bookmark.categories,
              mimeType: bookmark.mimeType,
              mediaType: bookmark.mediaType,
              createdAt: bookmark.createdAt,
            }))
          );

          imported = result.added;
          skipped = result.skipped;
          clearLegacyLocalBookmarks();
        }

        if (legacyCategories.length > 0) {
          const remoteCategories = await loadCustomCategories();
          const merged = Array.from(new Set([...remoteCategories, ...legacyCategories]));
          await saveCustomCategories(merged);
          clearLegacyCustomCategories();

          if (isActive) {
            setCustomCategories(merged);
          }
        }

        if (isActive) {
          setCsvStatus(
            `Migration complete: imported ${imported} bookmark${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}.`
          );
          setCsvError(null);
          setRefreshTrigger((prev) => prev + 1);
        }

        localStorage.setItem(migrationStateKey, 'done');
      } catch (error) {
        console.error('Failed to migrate local data:', error);
        localStorage.removeItem(migrationStateKey);

        if (isActive) {
          setCsvError('Failed to migrate local bookmarks. You can keep using your existing account data and retry later.');
        }
      }
    };

    void migrateLegacyData();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const persistCustomCategories = async (categories: string[]) => {
    const unique = Array.from(new Set(categories.map((category) => category.trim()).filter(Boolean)));
    setCustomCategories(unique);

    try {
      await saveCustomCategories(unique);
    } catch (error) {
      console.error('Failed to save custom categories:', error);
      setCsvError('Failed to save custom categories. Please try again.');
    }
  };

  const handleAddBookmark = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOptimisticBookmarkAdd = (bookmark: ImageBookmark) => {
    setGridResetToken((prev) => prev + 1);
    setBookmarks((prev) => [bookmark, ...prev.filter((item) => item.id !== bookmark.id)]);
  };

  const handleOptimisticBookmarkResolve = (
    temporaryId: string,
    bookmark: ImageBookmark
  ) => {
    setGridResetToken((prev) => prev + 1);
    setBookmarks((prev) => [
      bookmark,
      ...prev.filter((item) => item.id !== temporaryId && item.id !== bookmark.id),
    ]);
  };

  const handleOptimisticBookmarkRemove = (temporaryId: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== temporaryId));
  };

  const handleBookmarksReordered = (nextBookmarks: ImageBookmark[]) => {
    setGridResetToken((prev) => prev + 1);
    setBookmarks(nextBookmarks);
  };

  const categories = useMemo(() => {
    const categorySet = new Set<string>(customCategories);
    bookmarks.forEach((bookmark) => {
      bookmark.categories?.forEach((category) => categorySet.add(category));
    });
    return Array.from(categorySet);
  }, [bookmarks, customCategories]);

  useEffect(() => {
    setSelectedCategories((prev) => {
      const next = prev.filter((category) => categories.includes(category));
      return next.length === prev.length ? prev : next;
    });
  }, [categories]);

  const handleAddCategory = async () => {
    const name = window.prompt('Enter a new category name:');
    if (name === null) {
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.toLowerCase();
    const existing = categories.find((category) => category.toLowerCase() === normalized);
    if (existing) {
      setSelectedCategories((prev) => (prev.includes(existing) ? prev : [...prev, existing]));
      return;
    }

    const updated = [...customCategories, trimmed];
    await persistCustomCategories(updated);
    setSelectedCategories((prev) => [...prev, trimmed]);
  };

  const handleDeleteCategory = async (category: string) => {
    if (
      !window.confirm(
        `Delete the "${category}" category from all bookmarks? This cannot be undone.`
      )
    ) {
      return;
    }

    const updatedCustomCategories = customCategories.filter((item) => item !== category);
    if (updatedCustomCategories.length !== customCategories.length) {
      await persistCustomCategories(updatedCustomCategories);
    }

    try {
      const updatedBookmarks = await removeCategoryFromBookmarks(category);
      setBookmarks(updatedBookmarks);
      setSelectedCategories((prev) => prev.filter((item) => item !== category));
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete category from bookmarks:', error);
      setCsvError('Failed to delete category from bookmarks. Please try again.');
    }
  };

  const handleImageClick = (index: number, items: ImageBookmark[]) => {
    setLightboxBookmarks(items);
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = 'auto';
  };

  const handleNextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < lightboxBookmarks.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleShuffle = () => {
    setCsvError(null);
    setCsvStatus(null);
    setBookmarks((previous) => {
      const shuffled = [...previous];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
      }

      void saveCurrentViewOrder(shuffled.map((bookmark) => bookmark.id)).catch((error) => {
        console.error('Failed to save shuffled order:', error);
        const message = error instanceof Error ? error.message : String(error);
        setCsvError(`Failed to save shuffled order. ${message || 'Please try again.'}`);
      });

      return shuffled;
    });
  };

  const handleReorder = () => {
    setCsvError(null);
    setCsvStatus(null);
    setBookmarks((previous) => {
      const ordered = [...previous].sort((left, right) => right.createdAt - left.createdAt);
      void clearCurrentViewOrder().catch((error) => {
        console.error('Failed to clear custom order:', error);
        const message = error instanceof Error ? error.message : String(error);
        setCsvError(`Failed to clear custom order. ${message || 'Please try again.'}`);
      });
      return ordered;
    });
  };

  const handleDownloadCsv = () => {
    const csv = buildBookmarksCsv(bookmarks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `image-bookmarks-${dateStamp}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerCsvUpload = () => {
    setCsvError(null);
    setCsvStatus(null);
    fileInputRef.current?.click();
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseBookmarksCsv(text);
      if (parsed.length === 0) {
        setCsvError('No valid rows found. Please ensure the CSV includes a URL column.');
        return;
      }

      let invalidCount = 0;
      const validEntries = parsed.filter((entry) => {
        if (entry.mediaType === 'video') {
          return true;
        }
        try {
          const parsedUrl = new URL(entry.url);
          return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        } catch {
          invalidCount += 1;
          return false;
        }
      });

      if (validEntries.length === 0) {
        setCsvError('All rows were invalid or missing image URLs.');
        return;
      }

      const { added, skipped } = await addBookmarksFromImport(validEntries);
      setRefreshTrigger((prev) => prev + 1);
      setCsvStatus(
        `Imported ${added} ${added === 1 ? 'bookmark' : 'bookmarks'}${skipped ? `, skipped ${skipped}` : ''}${invalidCount ? `, ignored ${invalidCount} invalid URL${invalidCount === 1 ? '' : 's'}` : ''
        }.`
      );
      setCsvError(null);
    } catch (error) {
      console.error('Failed to import CSV:', error);
      setCsvError('Failed to import CSV. Please check the file format and try again.');
    } finally {
      event.target.value = '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isConfigured || !user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header userEmail={user.email} onSignOut={signOut} />
      <main className="py-8">
        {showInputBar ? (
          <InputBar
            onOptimisticBookmarkAdd={handleOptimisticBookmarkAdd}
            onOptimisticBookmarkResolve={handleOptimisticBookmarkResolve}
            onOptimisticBookmarkRemove={handleOptimisticBookmarkRemove}
            onBookmarksReordered={handleBookmarksReordered}
            currentBookmarks={bookmarks}
            selectedCategories={selectedCategories}
            onClose={() => setShowInputBar(false)}
          />
        ) : (
          <div className="w-full max-w-4xl mx-auto p-4">
            <button
              type="button"
              onClick={() => setShowInputBar(true)}
              className="px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              + Add Bookmark
            </button>
          </div>
        )}
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={bookmarks.length === 0}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${bookmarks.length === 0
                ? 'bg-emerald-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={handleTriggerCsvUpload}
            className="px-4 py-2 rounded-md text-white font-medium bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            Upload CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
        </div>
        {(csvStatus || csvError) && (
          <div className="w-full max-w-4xl mx-auto px-4 pb-4">
            {csvStatus && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {csvStatus}
              </div>
            )}
            {csvError && (
              <div className="text-sm text-red-600 dark:text-red-400">{csvError}</div>
            )}
          </div>
        )}
        {bookmarks.length > 0 && (
          <>
            <CategorySelector
              categories={categories}
              selected={selectedCategories}
              onToggle={(category) => {
                setSelectedCategories((prev) =>
                  prev.includes(category)
                    ? prev.filter((item) => item !== category)
                    : [...prev, category]
                );
              }}
              onClear={() => setSelectedCategories([])}
              onAddCategory={() => void handleAddCategory()}
              onDeleteCategory={(category) => {
                void handleDeleteCategory(category);
              }}
            />
            <div className="w-full max-w-4xl mx-auto p-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Search Images
              </button>
              <button
                type="button"
                onClick={handleShuffle}
                className="px-4 py-2 rounded-md text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Shuffle Images
              </button>
              <button
                type="button"
                onClick={handleReorder}
                className="px-4 py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Reorder Images
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicatesOnly((prev) => !prev)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${showDuplicatesOnly
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                  }`}
              >
                {showDuplicatesOnly ? 'Show All Images' : 'Show Duplicates'}
              </button>
              <button
                type="button"
                onClick={() => setShowUntitledOnly((prev) => !prev)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${showUntitledOnly
                    ? 'bg-slate-700 hover:bg-slate-800'
                    : 'bg-slate-500 hover:bg-slate-600'
                  }`}
              >
                {showUntitledOnly ? 'Show All' : 'Show Untitled'}
              </button>
              {!selectMode && (
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Select
                </button>
              )}
            </div>
          </>
        )}
        <Gallery
          bookmarksFromApp={bookmarks}
          loadingFromApp={bookmarksLoading}
          gridResetToken={gridResetToken}
          onImageClick={handleImageClick}
          onAddBookmark={handleAddBookmark}
          selectedCategories={selectedCategories}
          selectMode={selectMode}
          setSelectMode={setSelectMode}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showDuplicatesOnly={showDuplicatesOnly}
          showUntitledOnly={showUntitledOnly}
        />
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          bookmarks={lightboxBookmarks}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          overlayOpacity={lightboxOverlayOpacity}
          onOverlayOpacityChange={setLightboxOverlayOpacity}
        />
      )}
      <ScrollToTopButton />
      <ScrollToBottomButton />
    </div>
  );
}
