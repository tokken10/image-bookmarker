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
          className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${selected.length === 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <div
              key={cat}
              className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full text-sm shadow-sm transition-all duration-200 active:scale-[0.98] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 ${isSelected
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
            >
              <button
                type="button"
                onClick={() => onToggle(cat)}
                className={`px-4 py-2 font-medium focus-visible:outline-none ${isSelected
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-200'
                  }`}
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
                  className={`flex items-center justify-center h-full px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-full ${isSelected
                    ? 'text-white/80 hover:text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600'
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
