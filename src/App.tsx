import { useState, useEffect, useMemo } from 'react';
import type { ImageBookmark } from './types';
import { loadBookmarks, reorderBookmarks, shuffleBookmarks } from './lib/storage';
import Header from './components/Header';
import InputBar from './components/InputBar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';
import CategorySelector from './components/CategorySelector';
import ScrollToTopButton from './components/ScrollToTopButton';

export default function App() {
  console.log('App component rendering...');
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxBookmarks, setLightboxBookmarks] = useState<ImageBookmark[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const handleAddBookmark = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach(b => {
      b.categories?.forEach((cat) => set.add(cat));
    });
    return Array.from(set);
  }, [bookmarks]);

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  const handleUpdateBookmark = (updated: ImageBookmark) => {
    setBookmarks(prev =>
      prev.map(bookmark => (bookmark.id === updated.id ? updated : bookmark))
    );
    setLightboxBookmarks(prev =>
      prev.map(bookmark => (bookmark.id === updated.id ? updated : bookmark))
    );
    setRefreshTrigger(prev => prev + 1);
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
        <InputBar onAddBookmark={handleAddBookmark} selectedCategory={selectedCategory} />
        <CategorySelector
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="w-full max-w-4xl mx-auto p-4 flex gap-4">
          <button
            type="button"
            onClick={handleShuffle}
            disabled={bookmarks.length === 0}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              bookmarks.length === 0
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            Shuffle Images
          </button>
          <button
            type="button"
            onClick={handleReorder}
            disabled={bookmarks.length === 0}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              bookmarks.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700'
            } transition-colors`}
          >
            Reorder Images
          </button>
        </div>
        <Gallery
          onImageClick={handleImageClick}
          refreshTrigger={refreshTrigger}
          onAddBookmark={handleAddBookmark}
          selectedCategory={selectedCategory}
        />
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          bookmarks={lightboxBookmarks}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          onUpdateBookmark={handleUpdateBookmark}
          allCategories={categories}
        />
      )}
      <ScrollToTopButton />
    </div>
  );
}
