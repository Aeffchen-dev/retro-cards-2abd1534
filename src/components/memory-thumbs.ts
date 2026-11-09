// Small on-device thumbnails of Memory photos, kept for the year review.
export const MEMORY_THUMBS_KEY = 'retro-memory-thumbs-v1';
export type MemoryThumb = { at: string; src: string };
const MAX_THUMBS = 24;

export function readMemoryThumbs(): MemoryThumb[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(MEMORY_THUMBS_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((t): t is MemoryThumb => typeof t?.at === 'string' && typeof t?.src === 'string') : [];
  } catch { return []; }
}

export function saveMemoryThumb(dataUrl: string) {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 320 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      const next = [...readMemoryThumbs(), { at: new Date().toISOString(), src: canvas.toDataURL('image/jpeg', 0.7) }].slice(-MAX_THUMBS);
      localStorage.setItem(MEMORY_THUMBS_KEY, JSON.stringify(next));
    } catch { /* storage full: the review simply has no photo */ }
  };
  img.src = dataUrl;
}
