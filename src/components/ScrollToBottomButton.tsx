import { useEffect, useState } from 'react';

export default function ScrollToBottomButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const { scrollY, innerHeight } = window;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight;
      setIsVisible(scrollY + innerHeight < maxScroll - 300);
    };

    updateVisibility();

    window.addEventListener('scroll', updateVisibility);
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  const handleClick = () => {
    const doc = document.documentElement;
    window.scrollTo({ top: doc.scrollHeight, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed bottom-6 right-24 p-3 rounded-full bg-blue-600 text-white shadow-lg transition-opacity duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
