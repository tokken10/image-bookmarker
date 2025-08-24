import { useState, useEffect } from 'react';
import type { ImageBookmark, Topic } from './types';
import { loadStore, addTopic, renameTopic, deleteTopic, deleteImage } from './lib/storage';
import { filterByTopic } from './lib/filter';
import Header from './components/Header';
import TopicBar from './components/TopicBar';
import InputBar from './components/InputBar';
import Gallery from './components/Gallery';
import Lightbox from './components/Lightbox';

export default function App() {
  const [images, setImages] = useState<ImageBookmark[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const refresh = () => {
    const store = loadStore();
    setImages(store.images);
    setTopics(store.topics);
  };

  useEffect(() => {
    const store = loadStore();
    setImages(store.images);
    setTopics(store.topics);
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    if (topicParam && (topicParam === 'all' || store.topics.some(t => t.slug === topicParam))) {
      setActiveTopic(topicParam);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTopic === 'all') {
      params.delete('topic');
    } else {
      params.set('topic', activeTopic);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [activeTopic]);

  const handleSelectTopic = (slug: string) => {
    setActiveTopic(slug);
  };

  const handleCreateTopic = (name: string): Topic => {
    const t = addTopic(name);
    refresh();
    return t;
  };

  const handleRenameTopic = (oldSlug: string, newName: string) => {
    renameTopic(oldSlug, newName);
    refresh();
  };

  const handleDeleteTopic = (slug: string) => {
    deleteTopic(slug);
    refresh();
    if (activeTopic === slug) setActiveTopic('all');
  };

  const handleAddBookmark = () => {
    refresh();
  };

  const handleDeleteImage = (id: string) => {
    deleteImage(id);
    refresh();
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = 'auto';
  };

  const handleNextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleUpdateBookmark = (updated: ImageBookmark) => {
    setImages(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    refresh();
  };

  const filteredImages = filterByTopic(images, activeTopic);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <TopicBar
        topics={topics}
        activeTopic={activeTopic}
        onSelect={handleSelectTopic}
        onCreate={handleCreateTopic}
        onRename={handleRenameTopic}
        onDelete={handleDeleteTopic}
      />
      <main className="py-8">
        <InputBar topics={topics} onAddBookmark={handleAddBookmark} onCreateTopic={handleCreateTopic} />
        <Gallery
          images={filteredImages}
          onImageClick={handleImageClick}
          onDeleteImage={handleDeleteImage}
          activeTopic={activeTopic}
        />
      </main>
      {lightboxIndex !== null && (
        <Lightbox
          bookmarks={filteredImages}
          topics={topics}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          onUpdateBookmark={handleUpdateBookmark}
        />
      )}
    </div>
  );
}
