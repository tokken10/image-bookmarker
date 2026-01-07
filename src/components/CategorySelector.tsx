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
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selected.length === 0
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:text-white dark:border-blue-400 dark:hover:bg-blue-400'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <div
              key={cat}
              className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full border text-sm shadow-sm transition active:scale-[0.98] ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:text-white dark:border-blue-400 dark:hover:bg-blue-400'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
              } ${isManageMode ? 'overflow-hidden' : ''} focus-within:ring-2 focus-within:ring-blue-500`}
            >
              <button
                type="button"
                onClick={() => onToggle(cat)}
                className="px-3 py-1.5 font-medium focus-visible:outline-none"
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
                  className={`border-l px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected
                      ? 'border-white/20 text-white/80 hover:text-white hover:bg-white/10 dark:border-white/20 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10'
                      : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
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
