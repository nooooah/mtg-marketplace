/**
 * Shared utility functions used across the app.
 */

/** Format an ISO date string as "Jan 1, 2025" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
