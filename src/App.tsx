import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  ListChecks,
  RotateCcw,
  Check,
  X,
  Undo2,
  Sparkles,
  Trophy,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { COUNTRIES, Country } from './data/countries';
import { FlagImage } from './components/FlagImage';
import { SolvedManagerDrawer } from './components/SolvedManagerDrawer';
import { soundManager } from './utils/soundEffects';

const STORAGE_KEY = 'world_flag_quiz_solved_v1';

interface Question {
  answer: Country;
  options: Country[];
}

function generateQuestion(
  unsolvedPool: Country[],
  allCountries: Country[],
  previousCode?: string
): Question | null {
  if (unsolvedPool.length === 0) return null;

  const candidates =
    unsolvedPool.length > 1 && previousCode
      ? unsolvedPool.filter((c) => c.code !== previousCode)
      : unsolvedPool;

  const answer = candidates[Math.floor(Math.random() * candidates.length)];

  const sameContinent = allCountries.filter(
    (c) => c.code !== answer.code && c.continent === answer.continent
  );
  const otherContinent = allCountries.filter(
    (c) => c.code !== answer.code && c.continent !== answer.continent
  );

  const shuffledSame = [...sameContinent].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherContinent].sort(() => Math.random() - 0.5);

  const distractors = [
    ...shuffledSame.slice(0, 2),
    ...shuffledOther.slice(0, 2),
  ];

  if (distractors.length < 4) {
    const usedCodes = new Set([answer.code, ...distractors.map((d) => d.code)]);
    for (const c of shuffledOther) {
      if (distractors.length >= 4) break;
      if (!usedCodes.has(c.code)) {
        distractors.push(c);
        usedCodes.add(c.code);
      }
    }
  }

  const options = [answer, ...distractors.slice(0, 4)].sort(
    () => Math.random() - 0.5
  );

  return { answer, options };
}

export default function App() {
  const totalCountries = COUNTRIES.length;

  const [solvedCodes, setSolvedCodes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validCodes = new Set(COUNTRIES.map((c) => c.code));
          return new Set(parsed.filter((code) => validCodes.has(code)));
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(solvedCodes)));
    } catch {
      // ignore localStorage write errors
    }
  }, [solvedCodes]);

  const [isMuted, setIsMuted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scoreBump, setScoreBump] = useState(false);
  const [recentSolvedList, setRecentSolvedList] = useState<Country[]>([]);

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);

  const unsolvedPool = useMemo(() => {
    return COUNTRIES.filter((c) => !solvedCodes.has(c.code));
  }, [solvedCodes]);

  const loadNextQuestion = useCallback(
    (customSolvedSet?: Set<string>, prevAnswerCode?: string) => {
      const activeSet = customSolvedSet ?? solvedCodes;
      const pool = COUNTRIES.filter((c) => !activeSet.has(c.code));
      const nextQ = generateQuestion(pool, COUNTRIES, prevAnswerCode);
      setQuestion(nextQ);
      setSelectedCode(null);
      setFeedback(null);
      setShowHint(false);
    },
    [solvedCodes]
  );

  useEffect(() => {
    if (!question && unsolvedPool.length > 0) {
      loadNextQuestion();
    }
  }, [question, unsolvedPool.length, loadNextQuestion]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.isMuted = nextMuted;
  };

  const handleSelectOption = (option: Country) => {
    if (!question || feedback !== null) return;

    setSelectedCode(option.code);
    const isCorrect = option.code === question.answer.code;

    if (isCorrect) {
      setFeedback('correct');
      soundManager.playKidsYay();

      setScoreBump(true);
      setTimeout(() => setScoreBump(false), 450);

      const nextSolved = new Set(solvedCodes);
      nextSolved.add(question.answer.code);
      setSolvedCodes(nextSolved);

      setRecentSolvedList((prev) => {
        const filtered = prev.filter((c) => c.code !== question.answer.code);
        return [question.answer, ...filtered].slice(0, 8);
      });
    } else {
      setFeedback('wrong');
      soundManager.playKidsWoo();
    }
  };

  const handleNextQuestion = () => {
    if (!question) return;
    soundManager.stopCurrent();
    loadNextQuestion(solvedCodes, question.answer.code);
  };

  const handleToggleCountrySolved = (code: string) => {
    const nextSolved = new Set(solvedCodes);
    if (nextSolved.has(code)) {
      nextSolved.delete(code);
      setRecentSolvedList((prev) => prev.filter((c) => c.code !== code));
    } else {
      nextSolved.add(code);
    }
    setSolvedCodes(nextSolved);

    setScoreBump(true);
    setTimeout(() => setScoreBump(false), 300);
  };

  const handleResetAllSolved = () => {
    const emptySet = new Set<string>();
    setSolvedCodes(emptySet);
    setRecentSolvedList([]);
    loadNextQuestion(emptySet);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDrawerOpen || !question) return;
      if (feedback === null) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < 5 && question.options[idx]) {
          handleSelectOption(question.options[idx]);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const solvedCount = solvedCodes.size;
  const progressPercent = Math.round((solvedCount / totalCountries) * 100);
  const isAllCompleted = unsolvedPool.length === 0 && feedback === null;

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-between overflow-hidden select-none">
      {/* Tall Mobile-First Container fit strictly inside 100dvh without vertical scroll */}
      <div className="w-full max-w-[430px] h-full bg-black flex flex-col justify-between px-3.5 py-2 sm:border-x sm:border-zinc-900 relative overflow-hidden">
        {/* 1. TOP SCORE DISPLAY AREA (최상단 맞힌 문제 갯수 표시 영역) */}
        <header className="w-full shrink-0">
          <div className="w-full bg-zinc-950 border border-zinc-800/90 rounded-2xl px-3 py-1.5 flex items-center justify-between gap-2">
            {/* Left: Sound Toggle */}
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors shrink-0"
              title={isMuted ? '효과음 켜기' : '효과음 끄기'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Center: Fraction Score (분자: 맞힌 수 / 분모: 전체 국기 나라 수) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-0.5 rounded-xl hover:bg-zinc-900/70 transition-colors group"
              title="터치하여 맞힌 국기 목록 확인 및 출제 범위 복귀"
            >
              <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors leading-none">
                맞힌 국기 / 전 세계 국기
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 leading-none">
                <span
                  className={`font-mono-num text-xl sm:text-2xl font-bold tracking-tight transition-transform duration-200 ${
                    scoreBump
                      ? 'scale-125 text-emerald-300'
                      : 'scale-100 text-emerald-400'
                  }`}
                >
                  {solvedCount}
                </span>
                <span className="font-mono-num text-base text-zinc-600 font-semibold">
                  /
                </span>
                <span className="font-mono-num text-lg sm:text-xl font-bold text-zinc-200">
                  {totalCountries}
                </span>
              </div>
            </button>

            {/* Right: Open Solved Manager Drawer */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="h-10 px-2.5 flex items-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold transition-colors shrink-0 whitespace-nowrap"
            >
              <ListChecks className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>출제관리</span>
            </button>
          </div>

          {/* Slim Progress Bar under Top Header */}
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-emerald-500 transition-transform duration-300 origin-left"
              style={{ transform: `scaleX(${solvedCount / totalCountries})` }}
            />
          </div>
        </header>

        {/* 2. MAIN QUIZ AREA (상단 국기 그림 + 학습 정보/다음 문제 버튼 + 중간 5지선다 답) */}
        {isAllCompleted ? (
          <main className="flex-1 flex flex-col items-center justify-center text-center py-4 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-display text-white">
                전 세계 {totalCountries}개국 국기 정복 완료!
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                모든 국기를 다 맞히셨습니다! 맞힌 국기를 해제하여 다시 출제 범위로 돌려보내거나 전체 초기화할 수 있습니다.
              </p>
            </div>
            <div className="w-full space-y-2 pt-1">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-full h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span>맞힌 국기 선택 해제하기</span>
              </button>
              <button
                onClick={handleResetAllSolved}
                className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>전체 초기화 후 다시 시작</span>
              </button>
            </div>
          </main>
        ) : (
          question && (
            <main className="flex-1 flex flex-col justify-between py-1.5 gap-2 min-h-0">
              {/* TOP SECTION: 3D FRAMED FLAG DISPLAY (입체 테두리가 적용된 국기 영역) */}
              <section className="flex flex-col items-center justify-center shrink-0">
                <div
                  className={`w-full h-[158px] sm:h-[172px] rounded-2xl p-2.5 flex items-center justify-center overflow-hidden transition-all duration-200 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border ${
                    feedback === 'correct'
                      ? 'border-emerald-500/90 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : feedback === 'wrong'
                      ? 'border-rose-500/90 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                      : 'border-zinc-800'
                  }`}
                >
                  <FlagImage
                    country={question.answer}
                    size="lg"
                    className="w-full h-full"
                  />
                </div>

                {/* Fixed-Height Answer Study Panel OR Hint Bar below Flag */}
                <div className="w-full mt-1.5 h-[48px] flex items-center">
                  {feedback !== null ? (
                    <div
                      className={`w-full h-full rounded-xl border px-3 flex items-center justify-between gap-2 ${
                        feedback === 'correct'
                          ? 'bg-emerald-950/60 border-emerald-500/70'
                          : 'bg-rose-950/60 border-rose-500/70'
                      }`}
                    >
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 leading-none">
                          <span
                            className={`font-display text-sm tracking-wide ${
                              feedback === 'correct'
                                ? 'text-emerald-300'
                                : 'text-rose-300'
                            }`}
                          >
                            {feedback === 'correct'
                              ? '예~! 정답!'
                              : '우~! 아쉬워요!'}
                          </span>
                          <span className="text-[11px] text-zinc-300 truncate">
                            {question.answer.continent} · 수도{' '}
                            {question.answer.capitalKo}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white mt-1 truncate leading-none">
                          정답: {question.answer.nameKo}{' '}
                          <span className="text-[11px] font-normal text-zinc-400">
                            ({question.answer.nameEn})
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className={`h-9 px-3.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1 shrink-0 transition-transform active:scale-95 whitespace-nowrap shadow ${
                          feedback === 'correct'
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
                            : 'bg-white hover:bg-zinc-200 text-black'
                        }`}
                      >
                        <span>다음 문제</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between px-1 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>남은 문제 {unsolvedPool.length}개</span>
                        <span aria-hidden="true">·</span>
                        <span>달성률 {progressPercent}%</span>
                      </div>

                      <button
                        onClick={() => setShowHint((prev) => !prev)}
                        className="text-xs text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {showHint
                            ? `${question.answer.continent} · 수도: ${question.answer.capitalKo}`
                            : '힌트 보기'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* MIDDLE SECTION: COMPACT 5 MULTIPLE-CHOICE OPTIONS (위아래 폭을 줄여 한 화면에 쏙 들어오는 5지선다) */}
              <section
                aria-label="5지선다 보기"
                className="flex flex-col gap-1.5 my-auto shrink-0"
              >
                {question.options.map((option, idx) => {
                  const isSelected = selectedCode === option.code;
                  const isAnswer = option.code === question.answer.code;

                  let buttonStyle =
                    'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-white active:scale-[0.99]';
                  let badgeStyle = 'bg-zinc-900 text-zinc-400 border-zinc-800';

                  if (feedback !== null) {
                    if (isAnswer) {
                      buttonStyle =
                        'bg-emerald-950/80 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400/50';
                      badgeStyle =
                        'bg-emerald-400 text-black border-emerald-300 font-bold';
                    } else if (isSelected && !isAnswer) {
                      buttonStyle =
                        'bg-rose-950/80 border-rose-500 text-rose-200';
                      badgeStyle =
                        'bg-rose-500 text-white border-rose-400 font-bold';
                    } else {
                      buttonStyle =
                        'bg-zinc-950/40 border-zinc-900 text-zinc-500';
                      badgeStyle = 'bg-zinc-900 text-zinc-600 border-zinc-900';
                    }
                  }

                  return (
                    <button
                      key={option.code}
                      onClick={() => handleSelectOption(option)}
                      disabled={feedback !== null}
                      className={`w-full h-[40px] sm:h-[42px] px-3.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all duration-150 ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md border text-xs font-mono-num flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm sm:text-[15px] font-semibold tracking-wide truncate">
                          {option.nameKo}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {feedback !== null && isAnswer && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 whitespace-nowrap">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>정답 ({option.continent})</span>
                          </span>
                        )}
                        {feedback !== null && isSelected && !isAnswer && (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-400 whitespace-nowrap">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>내 선택 ({option.continent})</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </section>
            </main>
          )
        )}

        {/* 3. BOTTOM QUICK-UNSOLVE BAR (최근 맞힌 문제 즉시 해제 -> 출제 범위로 귀속) */}
        <footer className="w-full pt-1.5 border-t border-zinc-900 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-medium text-zinc-400">
              맞힌 국기 터치 시 해제되어 다시 출제됩니다
            </span>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 whitespace-nowrap"
            >
              <span>전체 목록 ({solvedCount}개)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSolvedList.length === 0 ? (
            <div className="h-8 flex items-center justify-center rounded-xl bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-500">
              맞힌 국기가 여기에 표시됩니다 (터치하면 출제 범위로 복귀)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {recentSolvedList.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleToggleCountrySolved(country.code)}
                  title={`${country.nameKo} 맞힘 해제 (다시 출제 범위에 포함)`}
                  className="h-8 px-2 rounded-lg bg-zinc-900 hover:bg-rose-950/70 border border-zinc-800 hover:border-rose-700/80 flex items-center gap-1.5 shrink-0 transition-colors group"
                >
                  <div className="w-4 h-3 rounded-xs overflow-hidden shrink-0">
                    <FlagImage
                      country={country}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-200 group-hover:text-rose-200 whitespace-nowrap">
                    {country.nameKo}
                  </span>
                  <Undo2 className="w-3 h-3 text-zinc-500 group-hover:text-rose-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </footer>

        {/* Solved Countries Manager Bottom Sheet */}
        <SolvedManagerDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          solvedCodes={solvedCodes}
          onToggleCountry={handleToggleCountrySolved}
          onResetAllSolved={handleResetAllSolved}
        />
      </div>
    </div>
  );
}
