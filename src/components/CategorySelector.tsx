interface CategorySelectorProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategorySelector({ categories, selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by category</p>
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
