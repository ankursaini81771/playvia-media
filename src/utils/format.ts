/**
 * Formats a numeric view count into a compact string representation.
 * Example: 12500 -> "12K views", 1500000 -> "1.5M views"
 */
export const formatViews = (views: number = 0): string => {
  if (views < 1000) {
    return `${views} views`;
  }
  if (views < 1000000) {
    const kViews = (views / 1000).toFixed(1);
    return `${kViews.endsWith('.0') ? kViews.slice(0, -2) : kViews}K views`;
  }
  const mViews = (views / 1000000).toFixed(1);
  return `${mViews.endsWith('.0') ? mViews.slice(0, -2) : mViews}M views`;
};

/**
 * Calculates a relative "time ago" string from an ISO timestamp.
 * Example: "2026-07-10T12:00:00.000Z" -> "3 days ago"
 */
export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now.getTime() - created.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) {
    return 'just now';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
};
