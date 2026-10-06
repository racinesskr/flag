import React, { useState, useMemo } from 'react';
import { X, RotateCcw, CheckCircle2, Circle, Search } from 'lucide-react';
import { Country, COUNTRIES } from '../data/countries';
import { FlagImage } from './FlagImage';

interface SolvedManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  solvedCodes: Set<string>;
  onToggleCountry: (code: string) => void;
  onResetAllSolved: () => void;
}

type FilterMode = 'solved' | 'unsolved' | 'all';

export const SolvedManagerDrawer: React.FC<SolvedManagerDrawerProps> = ({
  isOpen,
  onClose,
  solvedCodes,
  onToggleCountry,
  onResetAllSolved,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('solved');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter((country: Country) => {
      const isSolved = solvedCodes.has(country.code);
      if (filterMode === 'solved' && !isSolved) return false;
      if (filterMode === 'unsolved' && isSolved) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        return (
          country.nameKo.toLowerCase().includes(q) ||
          country.nameEn.toLowerCase().includes(q) ||
          country.continent.toLowerCase().includes(q) ||
          country.capitalKo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [solvedCodes, filterMode, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet Container */}
      <div className="w-full max-w-[430px] mx-auto bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[86vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Drag Handle */}
        <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-zinc-900 shrink-0">
          <div>
            <h2 className="text-lg font-display tracking-wide text-white">
              맞힌 국기 관리 및 출제 복귀
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              맞힌 나라를 터치해 해제하면 다시 문제 출제 범위에 포함됩니다
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Segmented Filter & Search */}
        <div className="px-5 pt-3 pb-2 space-y-2.5 border-b border-zinc-900 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl flex-1">
              <button
                onClick={() => setFilterMode('solved')}
                className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'solved'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                맞힌 국기 ({solvedCodes.size})
              </button>
              <button
                onClick={() => setFilterMode('unsolved')}
                className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'unsolved'
                    ? 'bg-zinc-100 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                남은 국기 ({COUNTRIES.length - solvedCodes.size})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterMode === 'all'
                    ? 'bg-zinc-100 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                전체 ({COUNTRIES.length})
              </button>
            </div>
          </div>

          {/* Search & Reset Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="국가명, 대륙, 수도 검색..."
                className="w-full h-10 pl-9 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {solvedCodes.size > 0 && (
              <div>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="h-10 px-3 bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/80 text-zinc-300 hover:text-rose-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>전체 해제</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onResetAllSolved();
                        setConfirmReset(false);
                      }}
                      className="h-10 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
                    >
                      확인 초기화
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="h-10 px-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs whitespace-nowrap"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Country List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-zinc-900">
          {filteredCountries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-400">
                {filterMode === 'solved'
                  ? '아직 맞힌 국기가 없습니다. 퀴즈를 풀어보세요!'
                  : '검색 조건에 맞는 국가가 없습니다.'}
              </p>
            </div>
          ) : (
            filteredCountries.map((country) => {
              const isSolved = solvedCodes.has(country.code);
              return (
                <button
                  key={country.code}
                  onClick={() => onToggleCountry(country.code)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left group hover:bg-zinc-900/50 -mx-2 px-2 rounded-xl transition-colors min-h-[58px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 rounded overflow-hidden border border-zinc-800 shrink-0 bg-zinc-900">
                      <FlagImage country={country} size="sm" className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {country.nameKo}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {country.continent} · 수도 {country.capitalKo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSolved ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-amber-400 transition-colors whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>맞힘 (터치 시 출제 복귀)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors whitespace-nowrap">
                        <Circle className="w-4 h-4 shrink-0" />
                        <span>출제 범위 포함됨</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer button */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-zinc-100 hover:bg-white text-black font-semibold text-sm flex items-center justify-center transition-transform active:scale-[0.99]"
          >
            게임으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
