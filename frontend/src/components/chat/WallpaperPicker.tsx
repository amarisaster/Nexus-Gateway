/**
 * WallpaperPicker — Choose solid color, preset pattern, or upload image
 */

import { useState } from 'react';

interface WallpaperPickerProps {
  onSelect: (wallpaper: string) => void;
  onClose: () => void;
  current: string;
}

const SOLID_COLORS = [
  '#0c0a09', '#1c1917', '#1a1a2e', '#16213e', '#0f3460',
  '#1b1b2f', '#2d132c', '#3a0ca3', '#240046', '#10002b',
  '#1a0000', '#2d0000', '#0d1b2a', '#1b263b', '#0b132b',
];

const PRESETS = [
  { name: 'Starfield', value: 'preset:starfield' },
  { name: 'Gradient Dusk', value: 'linear-gradient(135deg, #0c0a09 0%, #2d132c 50%, #1a1a2e 100%)' },
  { name: 'Gradient Ocean', value: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)' },
  { name: 'Gradient Rose', value: 'linear-gradient(135deg, #1a0000 0%, #2d132c 50%, #3a0ca3 100%)' },
  { name: 'Gradient Forest', value: 'linear-gradient(135deg, #0c0a09 0%, #1a2f1a 50%, #0d2818 100%)' },
  { name: 'Warm Dark', value: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)' },
];

export default function WallpaperPicker({ onSelect, onClose, current }: WallpaperPickerProps) {
  const [tab, setTab] = useState<'colors' | 'presets' | 'upload'>('presets');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onSelect(`url(${reader.result})`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--color-bg-card)] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Chat Wallpaper</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-xs">Done</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(['presets', 'colors', 'upload'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                tab === t
                  ? 'bg-[#E8A4B8] text-black font-medium'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
              }`}
            >
              {t === 'presets' ? 'Presets' : t === 'colors' ? 'Colors' : 'Upload'}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <button
          onClick={() => onSelect('')}
          className="w-full mb-3 py-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors"
        >
          Reset to Default
        </button>

        {/* Colors */}
        {tab === 'colors' && (
          <div className="grid grid-cols-5 gap-2">
            {SOLID_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onSelect(color)}
                className={`aspect-square rounded-xl border-2 transition-all ${
                  current === color ? 'border-[#E8A4B8] scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Presets */}
        {tab === 'presets' && (
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => onSelect(preset.value)}
                className={`h-20 rounded-xl border-2 transition-all flex items-end p-2 ${
                  current === preset.value ? 'border-[#E8A4B8]' : 'border-transparent'
                }`}
                style={{
                  background: preset.value.startsWith('preset:')
                    ? 'radial-gradient(circle at 20% 30%, #ffffff08 1px, transparent 1px), radial-gradient(circle at 80% 70%, #ffffff08 1px, transparent 1px), radial-gradient(circle at 50% 50%, #ffffff05 1px, transparent 1px), #0c0a09'
                    : preset.value,
                  backgroundSize: preset.value.startsWith('preset:') ? '50px 50px, 30px 30px, 70px 70px, 100%' : undefined,
                }}
              >
                <span className="text-[10px] text-white/60">{preset.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Upload */}
        {tab === 'upload' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <label className="cursor-pointer px-6 py-3 bg-[var(--color-bg-secondary)] rounded-xl text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors">
              Choose Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <p className="text-[10px] text-[var(--color-text-muted)]">JPG, PNG, GIF. Stored locally in your browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}
