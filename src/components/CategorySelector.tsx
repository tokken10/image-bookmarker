import { useState } from 'react';

interface CategorySelectorProps {
  categories: string[];
  selected: string[];
  onToggle: (category: string) => void;
  onClear: () => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
}

export default function CategorySelector({
  categories,
  selected,
  onToggle,
  onClear,
  onAddCategory,
  onDeleteCategory,
}: CategorySelectorProps) {
  const [isManageMode, setIsManageMode] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by categories</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManageMode((prev) => !prev)}
            className="rounded-full border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
            aria-pressed={isManageMode}
          >
            {isManageMode ? 'Done' : 'Manage'}
          </button>
          <button
            type="button"
            onClick={onAddCategory}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-600 text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
            aria-label="Add new category"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={onClear}
          className={`px-3 py-1 rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
            selected.length === 0
              ? 'bg-blue-500 text-slate-900 border-blue-600 hover:bg-blue-600 dark:bg-blue-500 dark:text-slate-900 dark:border-blue-400 dark:hover:bg-blue-400'
              : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 dark:hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <div
              key={cat}
              className={`flex items-center rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-500 text-slate-900 border-blue-600 hover:bg-blue-600 dark:bg-blue-500 dark:text-slate-900 dark:border-blue-400 dark:hover:bg-blue-400'
                  : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 dark:hover:bg-slate-600'
              } ${isManageMode ? 'gap-1' : ''}`}
            >
              <button
                type="button"
                onClick={() => onToggle(cat)}
                className="px-3 py-1"
              >
                {cat}
              </button>
              {isManageMode && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteCategory(cat);
                  }}
                  className={`pr-2 pl-1 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'text-slate-700 hover:text-slate-900 dark:text-slate-800 dark:hover:text-slate-900'
                      : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
                  }`}
                  aria-label={`Delete category ${cat}`}
                  title={`Delete ${cat}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
