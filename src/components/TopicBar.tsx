import React from 'react';
import type { Topic } from '../types';

interface TopicBarProps {
  topics: Topic[];
  activeTopic: string;
  onSelect: (slug: string) => void;
  onCreate: (name: string) => void;
  onRename?: (oldSlug: string, newName: string) => void;
  onDelete?: (slug: string) => void;
}

export default function TopicBar({
  topics,
  activeTopic,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: TopicBarProps) {
  const baseClass =
    'inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-slate-100 hover:bg-slate-200';
  const activeClass = 'bg-indigo-600 text-white';

  const handleNew = () => {
    const name = window.prompt('Enter topic name');
    if (name) {
      onCreate(name);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    slug: string,
    name: string,
  ) => {
    e.preventDefault();
    const action = window.prompt('Type "r" to rename, "d" to delete');
    if (action === 'r' && onRename) {
      const newName = window.prompt('Rename topic', name);
      if (newName) onRename(slug, newName);
    } else if (action === 'd' && onDelete) {
      if (window.confirm('Delete this topic?')) onDelete(slug);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto p-2">
      <button
        className={`${baseClass} ${
          activeTopic === 'all' ? activeClass : ''
        }`}
        onClick={() => onSelect('all')}
      >
        All
      </button>
      {topics.map((t) => (
        <button
          key={t.id}
          className={`${baseClass} ${activeTopic === t.slug ? activeClass : ''}`}
          onClick={() => onSelect(t.slug)}
          onContextMenu={(e) => handleContextMenu(e, t.slug, t.name)}
        >
          {t.name}
        </button>
      ))}
      <button className={baseClass} onClick={handleNew}>
        + New Topic
      </button>
    </div>
  );
}
