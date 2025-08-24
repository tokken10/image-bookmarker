import React, { useState } from 'react';
import { isValidImageUrl } from '../utils/validation';
import { addImage } from '../lib/storage';
import type { Topic } from '../types';

interface InputBarProps {
  topics: Topic[];
  onAddBookmark: () => void;
  onCreateTopic: (name: string) => Topic;
}

export default function InputBar({ topics, onAddBookmark, onCreateTopic }: InputBarProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');

  const baseClass =
    'inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-slate-100 hover:bg-slate-200';
  const activeClass = 'bg-indigo-600 text-white';

  const toggleTopic = (slug: string) => {
    setSelectedTopics(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault();
      const t = onCreateTopic(topicInput.trim());
      setSelectedTopics(prev => [...prev, t.slug]);
      setTopicInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (!isValidImageUrl(url)) {
      setError('Please enter a valid image URL (jpg, jpeg, png, gif, webp, svg)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Test if the image can be loaded
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      // Add to store if image loads successfully
      addImage({ url, title: title.trim() || undefined, topics: selectedTopics });
      setUrl('');
      setTitle('');
      setSelectedTopics([]);
      onAddBookmark();
    } catch (err) {
      console.error('Failed to load image:', err);
      setError('Failed to load image. Please check the URL and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL *
          </label>
          <input
            id="image-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div>
          <label htmlFor="image-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title (optional)
          </label>
          <input
            id="image-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My beautiful image"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topics</span>
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <button
                type="button"
                key={t.id}
                className={`${baseClass} ${selectedTopics.includes(t.slug) ? activeClass : ''}`}
                onClick={() => toggleTopic(t.slug)}
              >
                {t.name}
              </button>
            ))}
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleTopicKeyDown}
              placeholder="Add topic"
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !url.trim()}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isSubmitting || !url.trim()
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isSubmitting ? 'Adding...' : 'Add Bookmark'}
        </button>
      </form>
    </div>
  );
}
