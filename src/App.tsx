import { useState, useEffect, useMemo } from 'react';
import type { ImageBookmark } from './types';
import { loadBookmarks, reorderBookmarks, shuffleBookmarks } from './lib/storage';
import Header from './components/Header';
import InputBar from './components/InputBar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';
import CategorySelector from './components/CategorySelector';
import ScrollToTopButton from './components/ScrollToTopButton';
import ScrollToBottomButton from './components/ScrollToBottomButton';

const CUSTOM_CATEGORIES_KEY = 'imageBookmarks:customCategories:v1';

export default function App() {
  console.log('App component rendering...');
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxBookmarks, setLightboxBookmarks] = useState<ImageBookmark[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showInputBar, setShowInputBar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Load bookmarks on initial render
  useEffect(() => {
    console.log('Loading bookmarks...');
    try {
      const savedBookmarks = loadBookmarks();
      console.log('Loaded bookmarks:', savedBookmarks);
      setBookmarks(savedBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .map((cat) => (typeof cat === 'string' ? cat.trim() : ''))
            .filter((cat): cat is string => Boolean(cat));
          const unique = Array.from(new Set(sanitized));
          setCustomCategories(unique);
        }
      }
    } catch (error) {
      console.error('Failed to load custom categories:', error);
    }
  }, []);

  const persistCustomCategories = (categories: string[]) => {
    const unique = Array.from(new Set(categories));
    setCustomCategories(unique);
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(unique));
    } catch (error) {
      console.error('Failed to save custom categories:', error);
    }
  };

  const handleAddBookmark = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const categories = useMemo(() => {
    const set = new Set<string>(customCategories);
    bookmarks.forEach(b => {
      b.categories?.forEach((cat) => set.add(cat));
    });
    return Array.from(set);
  }, [bookmarks, customCategories]);

  useEffect(() => {
    setSelectedCategories((prev) => {
      const next = prev.filter((cat) => categories.includes(cat));
      return next.length === prev.length ? prev : next;
    });
  }, [categories]);

  const handleAddCategory = () => {
    const name = window.prompt('Enter a new category name:');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const existing = categories.find((cat) => cat.toLowerCase() === normalized);
    if (existing) {
      setSelectedCategories((prev) => (prev.includes(existing) ? prev : [...prev, existing]));
      return;
    }

    const updated = [...customCategories, trimmed];
    persistCustomCategories(updated);
    setSelectedCategories((prev) => [...prev, trimmed]);
  };

  const handleImageClick = (index: number, items: ImageBookmark[]) => {
    setLightboxBookmarks(items);
    setLightboxIndex(index);
    // Disable body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    // Re-enable body scroll
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
    const shuffled = shuffleBookmarks();
    setBookmarks(shuffled);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReorder = () => {
    const ordered = reorderBookmarks();
    setBookmarks(ordered);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <main className="py-8">
        {showInputBar ? (
          <InputBar
            onAddBookmark={handleAddBookmark}
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
              onAddCategory={handleAddCategory}
            />
            <div className="w-full max-w-4xl mx-auto p-4 flex gap-4">
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
                onClick={() => setShowDuplicatesOnly(prev => !prev)}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  showDuplicatesOnly
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {showDuplicatesOnly ? 'Show All Images' : 'Show Duplicates'}
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
          onImageClick={handleImageClick}
          refreshTrigger={refreshTrigger}
          onAddBookmark={handleAddBookmark}
          selectedCategories={selectedCategories}
          selectMode={selectMode}
          setSelectMode={setSelectMode}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showDuplicatesOnly={showDuplicatesOnly}
        />
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          bookmarks={lightboxBookmarks}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
      <ScrollToTopButton />
      <ScrollToBottomButton />
    </div>
  );
}
