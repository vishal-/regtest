import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateProjectKey(name: string, customKey?: string): string {
  if (customKey && customKey.trim().length >= 2) {
    return customKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  }

  const stopWords = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'for', 'in', 'on', 'at', 'to', '&']);
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) return 'PRJ';
  if (words.length === 1) {
    const w = words[0].toUpperCase();
    return w.length >= 3 ? w.slice(0, 3) : w.padEnd(2, 'X');
  }
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
