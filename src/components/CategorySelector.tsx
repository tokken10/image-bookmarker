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
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by categories</p>
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
      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={onClear}
          className={`px-3 py-1 rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
            selected.length === 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <div
              key={cat}
              className={`flex items-center gap-1 rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(cat)}
                className="px-3 py-1"
              >
                {cat}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteCategory(cat);
                }}
                className={`pr-2 pl-1 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'text-white/80 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                aria-label={`Delete category ${cat}`}
                title={`Delete ${cat}`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
