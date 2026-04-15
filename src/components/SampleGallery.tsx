import { defaultImages } from '../data/defaultImages';

export default function SampleGallery() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100">
        Explore a sample gallery before signing in. Log in to add, edit, and organize your own image bookmarks.
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {defaultImages.map((image) => (
          <article
            key={image.url}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <img src={image.url} alt={image.title} className="h-56 w-full object-cover" loading="lazy" />
            <div className="space-y-3 p-4">
              <h2 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{image.title}</h2>
              <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{image.description}</p>
              <div className="flex flex-wrap gap-2">
                {image.categories.map((category) => (
                  <span
                    key={`${image.url}-${category}`}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
