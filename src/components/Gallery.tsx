import React from 'react';
import type { ImageBookmark } from '../types';
import { formatDate } from '../utils/validation';

interface GalleryProps {
  images: ImageBookmark[];
  onImageClick: (index: number) => void;
  onDeleteImage: (id: string) => void;
  activeTopic: string;
}

export default function Gallery({ images, onImageClick, onDeleteImage, activeTopic }: GalleryProps) {
  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this bookmark?')) {
      onDeleteImage(id);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {activeTopic && activeTopic !== 'all'
            ? `No images in ${activeTopic} yet.`
            : 'No bookmarks yet'}
        </h3>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((bookmark, index) => (
          <div
            key={bookmark.id}
            onClick={() => onImageClick(index)}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden shadow-md cursor-pointer bg-gray-100 dark:bg-gray-800"
          >
            <img
              src={bookmark.url}
              alt={bookmark.title || 'Bookmarked image'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="truncate">{bookmark.title || 'Untitled'}</div>
              <div className="text-xs opacity-80">{formatDate(bookmark.createdAt)}</div>
            </div>
            <button
              onClick={(e) => handleRemove(e, bookmark.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove bookmark"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
