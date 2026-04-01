/**
 * GifPicker — Search and send GIFs via GIPHY API
 */

import { useState, useEffect, useRef } from 'react';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

const GIPHY_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<Array<{ id: string; url: string; preview: string }>>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Load trending on open
  useEffect(() => {
    fetchTrending();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      fetchTrending();
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSearch(search.trim());
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  async function fetchTrending() {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=pg-13`);
      const data = await res.json();
      setGifs(parseGifs(data));
    } catch {} finally { setLoading(false); }
  }

  async function fetchSearch(query: string) {
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`);
      const data = await res.json();
      setGifs(parseGifs(data));
    } catch {} finally { setLoading(false); }
  }

  function parseGifs(data: any): Array<{ id: string; url: string; preview: string }> {
    return (data.data || []).map((g: any) => ({
      id: g.id,
      url: g.images?.original?.url || g.images?.downsized?.url || '',
      preview: g.images?.fixed_height_small?.url || g.images?.preview_gif?.url || g.images?.fixed_height?.url || '',
    }));
  }

  return (
    <div ref={ref} className="absolute bottom-14 left-0 right-0 mx-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden" style={{ maxHeight: '300px' }}>
      {/* Search */}
      <div className="p-2 border-b border-[var(--color-border)]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full h-8 px-3 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-full border-none outline-none"
          autoFocus
        />
      </div>

      {/* Grid */}
      <div className="overflow-y-auto p-1.5 grid grid-cols-2 gap-1.5" style={{ maxHeight: '240px' }}>
        {loading && gifs.length === 0 && (
          <div className="col-span-2 flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#E8A4B8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {gifs.map(gif => (
          <button
            key={gif.id}
            onClick={() => onSelect(gif.url)}
            className="rounded-lg overflow-hidden hover:ring-2 hover:ring-[#E8A4B8] transition-all aspect-video bg-[var(--color-bg-secondary)]"
          >
            <img src={gif.preview} alt="" className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
        {!loading && gifs.length === 0 && (
          <p className="col-span-2 text-center text-xs text-[var(--color-text-muted)] py-8">No GIFs found</p>
        )}
      </div>

      {/* GIPHY attribution */}
      <div className="px-2 py-1 border-t border-[var(--color-border)] text-center">
        <span className="text-[8px] text-[var(--color-text-muted)]">Powered by GIPHY</span>
      </div>
    </div>
  );
}
