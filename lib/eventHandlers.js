/**
 * Handles navigation click events
 * @param {Event} e - The click event
 * @param {Function} router - Next.js router instance
 * @param {string} path - Path to navigate to
 */
export const handleNavigationClick = (e, router, path) => {
  e.preventDefault();
  
  // Optional: Add any transition effects or state changes before navigation
  
  // Navigate to the specified path
  router.push(path);
}; 