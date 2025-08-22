export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Image Bookmarker</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Save image URLs. Browse them in a visual grid.
          </p>
        </div>
      </div>
    </header>
  );
}
