interface CategorySelectorProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  onAddCategory: () => void;
}

export default function CategorySelector({ categories, selected, onSelect, onAddCategory }: CategorySelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category</p>
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
          onClick={() => onSelect('All')}
          className={`px-3 py-1 rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
            selected === 'All'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={`px-3 py-1 rounded-full border flex-shrink-0 whitespace-nowrap text-sm transition-colors ${
              selected === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
