interface CategorySelectorProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategorySelector({ categories, selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Filter by category
      </label>
      <select
        id="category-select"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
      >
        <option value="All">All</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
