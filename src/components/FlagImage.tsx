import React, { useState, useEffect } from 'react';
import { Country, getFlagEmoji } from '../data/countries';

interface FlagImageProps {
  country: Country;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FlagImage: React.FC<FlagImageProps> = ({
  country,
  className = '',
  size = 'lg',
}) => {
  const code = country.code.toLowerCase();
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [code]);

  // Bundled SVG assets work without an internet connection.
  const sources = [
    `${import.meta.env.BASE_URL}flags/${code}.svg`,
  ];

  // If the bundled image cannot load, render the emoji fallback.
  if (sourceIndex >= sources.length) {
    const emojiSize =
      size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-3xl' : 'text-xl';
    return (
      <div
        className={`flex flex-col items-center justify-center bg-zinc-900 border-2 border-zinc-400/60 rounded-lg shadow-md select-none ${className}`}
        role="img"
        aria-label={`${country.nameKo} 국기`}
      >
        <span className={emojiSize}>{getFlagEmoji(country.code)}</span>
      </div>
    );
  }

  const currentSrc = sources[sourceIndex];

  // Main Quiz Flag (lg): 3D metallic beveled border frame with explicit dimensions so every flag renders immediately
  if (size === 'lg') {
    return (
      <div
        className={`relative flex items-center justify-center w-full h-full ${className}`}
      >
        <div className="relative flex items-center justify-center rounded-lg p-[2.5px] bg-gradient-to-br from-zinc-100 via-zinc-400 to-zinc-600 shadow-[0_8px_24px_rgba(255,255,255,0.10),0_4px_14px_rgba(0,0,0,0.95)]">
          <div className="relative overflow-hidden rounded-[6px] bg-zinc-900 flex items-center justify-center">
            <img
              key={`${code}-${sourceIndex}`}
              src={currentSrc}
              alt={`${country.nameKo} 국기`}
              referrerPolicy="no-referrer"
              onError={() => setSourceIndex((prev) => prev + 1)}
              className="h-[136px] sm:h-[148px] w-auto max-w-[260px] sm:max-w-[290px] object-contain block select-none"
              draggable={false}
            />
            {/* 3D inner highlight & subtle bevel so black parts of flags are clearly separated from the background */}
            <div className="pointer-events-none absolute inset-0 rounded-[6px] ring-1 ring-inset ring-white/35 bg-gradient-to-tr from-black/10 via-transparent to-white/15" />
          </div>
        </div>
      </div>
    );
  }

  // Small / Medium thumbnails (drawer & bottom bar)
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-zinc-900 ring-1 ring-zinc-500/60 ${className}`}
    >
      <img
        key={`${code}-${sourceIndex}`}
        src={currentSrc}
        alt={`${country.nameKo} 국기`}
        referrerPolicy="no-referrer"
        onError={() => setSourceIndex((prev) => prev + 1)}
        className="w-full h-full object-cover block select-none"
        draggable={false}
      />
    </div>
  );
};

