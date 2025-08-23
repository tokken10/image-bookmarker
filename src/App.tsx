import { useState, useEffect } from 'react';
import type { ImageBookmark } from './types';
import { loadBookmarks } from './lib/storage';
import Header from './components/Header';
import InputBar from './components/InputBar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';

export default function App() {
  console.log('App component rendering...');
  const [bookmarks, setBookmarks] = useState<ImageBookmark[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleImageClick = (index: number) => {
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
    if (lightboxIndex !== null && lightboxIndex < bookmarks.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="py-8">
        <InputBar onAddBookmark={handleAddBookmark} />
        <Gallery
          onImageClick={handleImageClick}
          refreshTrigger={refreshTrigger}
          onAddBookmark={handleAddBookmark}
          searchQuery={searchQuery}
        />
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          bookmarks={bookmarks}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
    </div>
  );
}
