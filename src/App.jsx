import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Eraser,
  Trophy,
  Sparkles,
  RotateCcw,
  BookOpen,
  HelpCircle,
  X,
  Zap,
  Lightbulb,
  Target,
  Award,
  Search,
  CheckCircle2,
  Crown,
  Coins,
  Timer,
  Infinity as InfinityIcon,
  PlusCircle,
  Medal,
  Palette,
  Gift,
  HeartHandshake,
  Undo2,
  Music,
  Map as MapIcon,
  Snowflake,
  Star,
  Share2,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import {
  DICTIONARY,
  TOTAL_TDK_WORD_COUNT,
  searchTdkDictionary,
  generateSmartTray,
  matchSyllableSequence,
  findSaviorSyllables,
  registerCustomTurkishWord,
  resolveWildcardSyllableForCell,
  getTacticalCompletionHints
} from './data/dictionary';
import { soundEngine } from './utils/sound';
import { vfxManager } from './utils/vfxEngine';

const GRID_SIZE = 5;
const HIGH_SCORE_KEY = 'hece_zinciri_high_score_v1';
const BLITZ_HIGH_SCORE_KEY = 'hece_zinciri_blitz_high_v1';
const DISCOVERED_WORDS_KEY = 'hece_zinciri_discovered_v1';
const COINS_STORAGE_KEY = 'hece_zinciri_coins_v1';
const SAVED_STATE_KEY = 'hece_zinciri_saved_game_v6';
const ACHIEVEMENTS_KEY = 'hece_zinciri_achievements_v1';
const UNLOCKED_THEMES_KEY = 'hece_zinciri_themes_v1';
const ACTIVE_THEME_KEY = 'hece_zinciri_active_theme_v1';
const CAMPAIGN_PROGRESS_KEY = 'hece_zinciri_campaign_v1';
const LIFETIME_STATS_KEY = 'hece_zinciri_stats_v1';

const COSMETIC_THEMES = [
  {
    id: 'classic',
    name: 'Klasik 3D Stüdyo',
    desc: 'Canlı 3 boyutlu parlak taşlar',
    price: 0,
    classes: [
      'tile-3d-amber text-slate-950',
      'tile-3d-cyan text-slate-950',
      'tile-3d-emerald text-slate-950',
      'tile-3d-violet text-white',
      'tile-3d-rose text-white'
    ]
  },
  {
    id: 'neon',
    name: 'Siber Neon',
    desc: 'Karanlıkta parlayan Cyberpunk neon taşlar',
    price: 150,
    classes: ['tile-neon-cyan', 'tile-neon-pink', 'tile-neon-lime']
  },
  {
    id: 'wood',
    name: 'Ahşap Zen',
    desc: 'Klasik Scrabble tarzı sıcak ahşap taşlar',
    price: 200,
    classes: ['tile-wood-1', 'tile-wood-2']
  },
  {
    id: 'royal',
    name: 'Kraliyet Zümrüt & Altın',
    desc: 'Lüks altın varaklı ve zümrüt taşlar',
    price: 300,
    classes: ['tile-royal-gold', 'tile-royal-emerald']
  }
];

const RANKS = [
  { level: 1, title: 'Hece Çırağı', minScore: 0, nextScore: 400 },
  { level: 2, title: 'Kelime Kalfası', minScore: 400, nextScore: 1000 },
  { level: 3, title: 'Hece Ustası', minScore: 1000, nextScore: 2000 },
  { level: 4, title: 'Sözcük Mimarı', minScore: 2000, nextScore: 3500 },
  { level: 5, title: 'Dil Bilgesi', minScore: 3500, nextScore: 5500 },
  { level: 6, title: 'Baş Sözlükçü', minScore: 5500, nextScore: 8000 },
  { level: 7, title: 'Hece Efsanesi', minScore: 8000, nextScore: 12000 }
];

const ACHIEVEMENT_LIST = [
  {
    id: 'first_word',
    title: 'İlk Kıvılcım',
    desc: 'İlk Türkçe kelimeni patlat',
    reward: 50
  },
  {
    id: 'combo_3',
    title: 'Zincir Ustası',
    desc: 'x3 veya üzeri Kombo çarpanına ulaş',
    reward: 100
  },
  {
    id: 'fever_trigger',
    title: 'Ateş Modu!',
    desc: 'Ateş Çubuğunu doldurup Fever Modunu başlat',
    reward: 120
  },
  {
    id: 'ice_breaker',
    title: 'Buz Kıran',
    desc: 'Tahtadaki bir Kristal Buz hücresini kır',
    reward: 90
  },
  {
    id: 'chest_hunter',
    title: 'Hazine Avcısı',
    desc: 'Tahtadaki bir Hazine Sandığını patlatarak aç',
    reward: 100
  },
  {
    id: 'full_clear',
    title: 'Kusursuz Temizlik',
    desc: 'Tahtadaki tüm taşları tamamen sıfırla',
    reward: 150
  },
  {
    id: 'collector_20',
    title: 'Kelime Kaşifi',
    desc: 'Sözlükte 20 farklı kelime keşfet',
    reward: 200
  }
];

const CALLOUT_LABELS = ['SÜPER! ⚡', 'HARİKA! 🔥', 'MÜKEMMEL! 💥', 'ULTRA ZİNCİR! 🚀', 'EFSANEVİ! 👑'];

/**
 * Seferberlik (Bölüm Modu) Level Konfigürasyonu Üretici (Bölüm 1..50+)
 */
function getCampaignLevelConfig(levelNum) {
  const lvl = Math.max(1, Number(levelNum) || 1);
  const isBoss = lvl % 5 === 0;
  const iceCoords = [];

  if (lvl === 1) {
    iceCoords.push({ r: 2, c: 1 }, { r: 2, c: 3 });
  } else if (lvl === 2) {
    iceCoords.push({ r: 1, c: 2 }, { r: 2, c: 2 }, { r: 3, c: 2 });
  } else if (lvl === 3) {
    iceCoords.push({ r: 1, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }, { r: 3, c: 3 });
  } else {
    const count = Math.min(9, 2 + Math.floor(lvl * 0.7));
    const patterns = [
      { r: 2, c: 2 },
      { r: 1, c: 2 },
      { r: 3, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 3 },
      { r: 1, c: 1 },
      { r: 1, c: 3 },
      { r: 3, c: 1 },
      { r: 3, c: 3 },
      { r: 0, c: 2 },
      { r: 4, c: 2 }
    ];
    for (let i = 0; i < count && i < patterns.length; i++) {
      iceCoords.push(patterns[i]);
    }
  }

  return {
    level: lvl,
    title: isBoss ? `Bölüm ${lvl} • BOSS` : `Bölüm ${lvl}`,
    isBoss,
    maxMoves: Math.min(28, 12 + lvl * 2),
    targetWords: Math.min(12, 2 + Math.floor(lvl * 0.8)),
    targetScore: 250 + lvl * 200,
    iceCoords,
    rewardCoins: isBoss ? 220 + lvl * 15 : 100 + lvl * 10
  };
}

function createIceGridFromCoords(coords = []) {
  const g = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  coords.forEach(({ r, c }) => {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      g[r][c] = true;
    }
  });
  return g;
}

function countRemainingIce(iceGrid) {
  let count = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (iceGrid?.[r]?.[c]) count++;
    }
  }
  return count;
}

function getRankInfo(score) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) {
      const current = RANKS[i];
      const progress = Math.min(
        100,
        Math.round(((score - current.minScore) / (current.nextScore - current.minScore)) * 100)
      );
      return { ...current, progress };
    }
  }
  return { ...RANKS[0], progress: 0 };
}

function getTileThemeClass(syllable, themeId = 'classic', powerType = null) {
  if (powerType === 'wildcard' || syllable === '*') {
    return 'tile-wildcard';
  }
  const themeObj = COSMETIC_THEMES.find((t) => t.id === themeId) || COSMETIC_THEMES[0];
  const palette = themeObj.classes;
  if (!syllable) return palette[0];
  let hash = 0;
  for (let i = 0; i < syllable.length; i++) {
    hash = syllable.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function createEmptyMetaGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function pickRandomTargetWord(excludeWord = null) {
  const pool = DICTIONARY.filter((d) => d.word !== excludeWord);
  return pool[Math.floor(Math.random() * pool.length)] || DICTIONARY[0];
}

function scanRowAndColForWords(grid, placedRow, placedCol) {
  const foundWords = [];
  const SCORE_BY_LEN = { 2: 100, 3: 180, 4: 280, 5: 420 };

  const scanLine = (getCell, getCoords, directionLabel) => {
    const lineMatches = [];
    const coveredSpans = [];

    for (let len = GRID_SIZE; len >= 2; len--) {
      for (let start = 0; start <= GRID_SIZE - len; start++) {
        const end = start + len - 1;
        if (coveredSpans.some((sp) => start >= sp.start && end <= sp.end)) {
          continue;
        }

        const seq = [];
        for (let k = start; k <= end; k++) {
          seq.push(getCell(k));
        }

        if (seq.every(Boolean)) {
          const match = matchSyllableSequence(seq);
          if (match) {
            const coords = [];
            for (let k = start; k <= end; k++) {
              coords.push(getCoords(k));
            }
            lineMatches.push({
              word: match.word,
              syllables: match.syllables,
              coords,
              direction: directionLabel,
              baseScore: SCORE_BY_LEN[len] || 180
            });
            coveredSpans.push({ start, end });
          }
        }
      }
    }

    return lineMatches;
  };

  const rowMatches = scanLine(
    (c) => grid[placedRow][c],
    (c) => ({ r: placedRow, c }),
    'yatay'
  );

  const colMatches = scanLine(
    (r) => grid[r][placedCol],
    (r) => ({ r, c: placedCol }),
    'dikey'
  );

  foundWords.push(...rowMatches, ...colMatches);
  return foundWords;
}

function scanEntireBoard(grid) {
  const allMatches = [];
  const seenKeys = new Set();

  for (let i = 0; i < GRID_SIZE; i++) {
    const matches = scanRowAndColForWords(grid, i, i);
    for (const m of matches) {
      const key = `${m.direction}-${m.word}-${m.coords.map((c) => `${c.r},${c.c}`).join(';')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allMatches.push(m);
      }
    }
  }
  return allMatches;
}

function findBestMoveForTray(grid, tray) {
  const availableTiles = tray.filter((t) => !t.placed);
  if (availableTiles.length === 0) return null;

  let bestMove = null;
  let bestScore = -1;

  for (const tile of availableTiles) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== null) continue;

        const effectiveSyl =
          tile.powerType === 'wildcard' || tile.syllable === '*'
            ? resolveWildcardSyllableForCell(grid, r, c)
            : tile.syllable;

        const simGrid = grid.map((row) => [...row]);
        simGrid[r][c] = effectiveSyl;

        const matches = scanRowAndColForWords(simGrid, r, c);
        if (matches.length > 0) {
          const movePoints = matches.reduce((s, m) => s + m.baseScore, 0) * matches.length;
          if (movePoints > bestScore) {
            bestScore = movePoints;
            bestMove = {
              tileId: tile.id,
              syllable: effectiveSyl,
              r,
              c,
              words: matches.map((m) => m.word),
              isImmediateBlast: true
            };
          }
        }
      }
    }
  }

  if (bestMove) return bestMove;

  for (const tile of availableTiles) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== null) continue;
        const effectiveSyl =
          tile.powerType === 'wildcard' || tile.syllable === '*'
            ? resolveWildcardSyllableForCell(grid, r, c)
            : tile.syllable;

        const simGrid = grid.map((row) => [...row]);
        simGrid[r][c] = effectiveSyl;
        const saviors = findSaviorSyllables(simGrid);
        const matchesWithHand = saviors.filter((s) =>
          availableTiles.some((other) => other.id !== tile.id && other.syllable === s.syllable)
        );
        const score = matchesWithHand.length * 50 + saviors.length;
        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            tileId: tile.id,
            syllable: effectiveSyl,
            r,
            c,
            words: [],
            isImmediateBlast: false
          };
        }
      }
    }
  }

  return bestMove;
}

function canTileBlastImmediately(grid, tile) {
  if (!tile || tile.placed) return false;
  if (tile.powerType === 'wildcard' || tile.syllable === '*') {
    return grid.some((row) => row.some(Boolean));
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) continue;
      const simGrid = grid.map((row) => [...row]);
      simGrid[r][c] = tile.syllable;
      if (scanRowAndColForWords(simGrid, r, c).length > 0) {
        return true;
      }
    }
  }
  return false;
}

class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  handleReset = () => {
    try {
      localStorage.removeItem(SAVED_STATE_KEY);
    } catch {
      // ignore
    }
    this.setState({ hasError: false });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1120] text-white p-6 text-center">
          <h2 className="text-xl font-black text-amber-400 mb-2">Oyun Yeniden Başlatılıyor</h2>
          <p className="text-xs text-slate-400 mb-4">Kayıtlı oturum sıfırlanıp temiz tahta açılıyor.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm"
          >
            Oyunu Aç
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function HeceZinciriGame() {
  const savedSession = useMemo(() => {
    try {
      const raw = localStorage.getItem(SAVED_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.grid) &&
        parsed.grid.length === GRID_SIZE &&
        Array.isArray(parsed.tray) &&
        parsed.tray.length === 3
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Oyun Modu: 'classic' | 'campaign' | 'blitz'
  const [gameMode, setGameMode] = useState(() => savedSession?.gameMode || 'classic');
  const [timeLeft, setTimeLeft] = useState(() => savedSession?.timeLeft ?? 120);

  // Bölüm Modu (Campaign) İlerlemesi
  const [campaignProgress, setCampaignProgress] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CAMPAIGN_PROGRESS_KEY) || '{}');
      return {
        currentLevel: saved.currentLevel || 1,
        maxUnlockedLevel: saved.maxUnlockedLevel || 1,
        starsByLevel: saved.starsByLevel || {}
      };
    } catch {
      return { currentLevel: 1, maxUnlockedLevel: 1, starsByLevel: {} };
    }
  });

  const activeLevelConfig = useMemo(
    () => getCampaignLevelConfig(campaignProgress.currentLevel),
    [campaignProgress.currentLevel]
  );

  const [movesLeft, setMovesLeft] = useState(
    () => savedSession?.movesLeft ?? activeLevelConfig.maxMoves
  );
  const [levelVictoryData, setLevelVictoryData] = useState(null);

  const [grid, setGrid] = useState(() => savedSession?.grid || createEmptyGrid());
  const [cellMeta, setCellMeta] = useState(() => savedSession?.cellMeta || createEmptyMetaGrid());
  // ❄️ Kristal Buz Hücreleri Matrisi (5x5 boolean)
  const [iceGrid, setIceGrid] = useState(
    () =>
      savedSession?.iceGrid ||
      createIceGridFromCoords([
        { r: 1, c: 1 },
        { r: 3, c: 3 }
      ])
  );
  const [treasureChest, setTreasureChest] = useState(
    () => savedSession?.treasureChest || { r: 2, c: 2 }
  );

  const [tray, setTray] = useState(
    () => savedSession?.tray || generateSmartTray(createEmptyGrid())
  );
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [eraserActive, setEraserActive] = useState(false);
  const [inspectedCell, setInspectedCell] = useState(null);

  // ↩️ Son Hamleyi Geri Al (Undo) Geçmişi
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [undoCount, setUndoCount] = useState(() => savedSession?.undoCount ?? 2);

  // Ateş Modu (Fever Mode)
  const [feverCharge, setFeverCharge] = useState(() => savedSession?.feverCharge || 0);
  const [feverTurnsLeft, setFeverTurnsLeft] = useState(() => savedSession?.feverTurnsLeft || 0);

  // Kozmetik Tema
  const [unlockedThemes, setUnlockedThemes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(UNLOCKED_THEMES_KEY) || '["classic"]');
      return Array.isArray(saved) && saved.length > 0 ? saved : ['classic'];
    } catch {
      return ['classic'];
    }
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_THEME_KEY) || 'classic';
    } catch {
      return 'classic';
    }
  });

  // Kalıcı Oyuncu İstatistikleri
  const [lifetimeStats, setLifetimeStats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LIFETIME_STATS_KEY) || '{}');
      return {
        totalWords: saved.totalWords || 0,
        longestWord: saved.longestWord || '',
        iceBroken: saved.iceBroken || 0,
        chestsOpened: saved.chestsOpened || 0
      };
    } catch {
      return { totalWords: 0, longestWord: '', iceBroken: 0, chestsOpened: 0 };
    }
  });

  // Skor, Yuvarlanan Görsel Skor & Altın
  const [score, setScore] = useState(() => savedSession?.score || 0);
  const [displayScore, setDisplayScore] = useState(() => savedSession?.score || 0);
  const [scoreBoxPulse, setScoreBoxPulse] = useState(false);

  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [blitzHighScore, setBlitzHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem(BLITZ_HIGH_SCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [coins, setCoins] = useState(() => {
    try {
      const c = localStorage.getItem(COINS_STORAGE_KEY);
      return c !== null ? Number(c) : 200;
    } catch {
      return 200;
    }
  });

  const [wordsFoundCount, setWordsFoundCount] = useState(() => savedSession?.wordsFoundCount || 0);
  const [recentWords, setRecentWords] = useState(() => savedSession?.recentWords || []);
  const [streakCombo, setStreakCombo] = useState(() => savedSession?.streakCombo || 0);
  const [activeMultiplier, setActiveMultiplier] = useState(
    () => savedSession?.activeMultiplier || 1
  );
  const [maxComboReached, setMaxComboReached] = useState(() => savedSession?.maxComboReached || 1);

  const [discoveredWords, setDiscoveredWords] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DISCOVERED_WORDS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [targetQuest, setTargetQuest] = useState(
    () => savedSession?.targetQuest || pickRandomTargetWord()
  );

  const [refreshCount, setRefreshCount] = useState(() => savedSession?.refreshCount ?? 2);
  const [eraserCount, setEraserCount] = useState(() => savedSession?.eraserCount ?? 2);
  const [hintCount, setHintCount] = useState(() => savedSession?.hintCount ?? 2);
  const [activeHint, setActiveHint] = useState(null);

  const nextRewardThresholdRef = useRef(
    savedSession?.nextRewardThreshold || Math.floor((savedSession?.score || 0) / 500 + 1) * 500
  );
  const prevRankLevelRef = useRef(getRankInfo(savedSession?.score || 0).level);

  const [isMuted, setIsMuted] = useState(() => soundEngine.muted);
  const [isMusicOn, setIsMusicOn] = useState(() => soundEngine.musicPlaying);

  // Görsel Efekt State'leri
  const [isShaking, setIsShaking] = useState(false);
  const [blastingCells, setBlastingCells] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [jokerToast, setJokerToast] = useState(null);
  const [calloutBadge, setCalloutBadge] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Modallar
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showThemeShopModal, setShowThemeShopModal] = useState(false);
  const [showCampaignMapModal, setShowCampaignMapModal] = useState(false);
  const [dictSearch, setDictSearch] = useState('');
  const [dictFilter, setDictFilter] = useState('all');
  const [customWordInput, setCustomWordInput] = useState('');
  const [customWordFeedback, setCustomWordFeedback] = useState(null);
  const [dictionaryVersion, setDictionaryVersion] = useState(0);

  // Sürükle-Bırak ve Canvas Referansları
  const [dragState, setDragState] = useState(null);
  const boardRef = useRef(null);
  const scoreCardRef = useRef(null);
  const vfxCanvasRef = useRef(null);
  const dragMovedRef = useRef(false);

  // 1. 60 FPS AKILLI (ON-DEMAND) HTML5 CANVAS VFX DÖNGÜSÜ
  useEffect(() => {
    const canvas = vfxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = null;
    let isRunning = false;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = () => {
      vfxManager.updateAndDraw(ctx, window.innerWidth, window.innerHeight);
      if (vfxManager.hasActiveEffects()) {
        animId = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        isRunning = false;
        animId = null;
      }
    };

    const startLoopIfNeeded = () => {
      if (!isRunning && vfxManager.hasActiveEffects()) {
        isRunning = true;
        animId = requestAnimationFrame(loop);
      }
    };

    vfxManager.onWake = startLoopIfNeeded;
    startLoopIfNeeded();

    return () => {
      vfxManager.onWake = null;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. YUVARLANARAK ARTAN SKOR SAYACI
  useEffect(() => {
    if (displayScore === score) return;
    if (score === 0) {
      setDisplayScore(0);
      return;
    }
    const diff = score - displayScore;
    const step = Math.max(1, Math.ceil(diff / 10));
    const timer = setTimeout(() => {
      setDisplayScore((prev) => Math.min(score, prev + step));
    }, 22);
    return () => clearTimeout(timer);
  }, [score, displayScore]);

  const getCellPercentPosition = (r, c) => ({
    xPct: (c + 0.5) * (100 / GRID_SIZE),
    yPct: (r + 0.5) * (100 / GRID_SIZE)
  });

  const getCellScreenCenter = useCallback((r, c) => {
    if (!boardRef.current) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: rect.left + ((c + 0.5) / GRID_SIZE) * rect.width,
      y: rect.top + ((r + 0.5) / GRID_SIZE) * rect.height
    };
  }, []);

  const getScoreCardScreenCenter = useCallback(() => {
    if (!scoreCardRef.current) {
      return { x: window.innerWidth / 2, y: 80 };
    }
    const rect = scoreCardRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }, []);

  const showToast = useCallback((msg) => {
    setJokerToast(msg);
    setTimeout(() => {
      setJokerToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const triggerCallout = useCallback((multiplier, isFever = false) => {
    const label = isFever
      ? '🔥 ATEŞ MODU AKTİF! (x2 PUAN)'
      : CALLOUT_LABELS[Math.min(CALLOUT_LABELS.length - 1, Math.max(0, multiplier - 1))];
    setCalloutBadge(label);
    setTimeout(() => {
      setCalloutBadge((prev) => (prev === label ? null : prev));
    }, 1250);
  }, []);

  const triggerCanvasWordBlast = useCallback(
    (coordsList, comboMult = 1, isMegaLightning = false) => {
      const cellPoints = coordsList.map(({ r, c }) => getCellScreenCenter(r, c));
      const scoreTarget = getScoreCardScreenCenter();

      if (isMegaLightning && cellPoints.length > 0) {
        vfxManager.spawnMegaLightningStrike(cellPoints[0].x, cellPoints[0].y);
      }

      vfxManager.spawnWordBlastVfx(cellPoints, scoreTarget, comboMult, () => {
        setScoreBoxPulse(true);
        setTimeout(() => setScoreBoxPulse(false), 180);
      });
    },
    [getCellScreenCenter, getScoreCardScreenCenter]
  );

  const spawnFloatingText = useCallback((text, subtext, r, c, isCombo = false) => {
    const id = `ft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { xPct, yPct } = getCellPercentPosition(r, c);
    const clampedX = Math.max(22, Math.min(78, xPct));
    const clampedY = Math.max(18, Math.min(82, yPct));

    setFloatingTexts((prev) => [
      ...prev,
      { id, text, subtext, xPct: clampedX, yPct: clampedY, isCombo }
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1350);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COINS_STORAGE_KEY, String(coins));
    } catch {
      // ignore
    }
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(lifetimeStats));
    } catch {
      // ignore
    }
  }, [lifetimeStats]);

  useEffect(() => {
    try {
      localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(campaignProgress));
    } catch {
      // ignore
    }
  }, [campaignProgress]);

  const unlockAchievement = useCallback(
    (achId) => {
      setUnlockedAchievements((prev) => {
        if (prev.includes(achId)) return prev;
        const achObj = ACHIEVEMENT_LIST.find((a) => a.id === achId);
        const next = [...prev, achId];
        try {
          localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        if (achObj) {
          setCoins((c) => c + achObj.reward);
          showToast(`🏆 Başarım: ${achObj.title} (+${achObj.reward} Altın!)`);
          soundEngine.playFanfare();
        }
        return next;
      });
    },
    [showToast]
  );

  // Blitz Modu Zamanlayıcısı
  useEffect(() => {
    if (gameMode !== 'blitz' || isGameOver || levelVictoryData) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playGameOver();
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, isGameOver, levelVictoryData]);

  // Oyun durumunu kaydet
  useEffect(() => {
    if (isGameOver || levelVictoryData) return;
    try {
      localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify({
          gameMode,
          timeLeft,
          movesLeft,
          grid,
          cellMeta,
          iceGrid,
          treasureChest,
          feverCharge,
          feverTurnsLeft,
          tray,
          score,
          wordsFoundCount,
          recentWords,
          streakCombo,
          activeMultiplier,
          maxComboReached,
          targetQuest,
          refreshCount,
          eraserCount,
          hintCount,
          undoCount,
          nextRewardThreshold: nextRewardThresholdRef.current
        })
      );
    } catch {
      // ignore
    }
  }, [
    gameMode,
    timeLeft,
    movesLeft,
    grid,
    cellMeta,
    iceGrid,
    treasureChest,
    feverCharge,
    feverTurnsLeft,
    tray,
    score,
    wordsFoundCount,
    recentWords,
    streakCombo,
    activeMultiplier,
    maxComboReached,
    targetQuest,
    refreshCount,
    eraserCount,
    hintCount,
    undoCount,
    isGameOver,
    levelVictoryData
  ]);

  useEffect(() => {
    if (gameMode === 'classic' && score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore
      }
    } else if (gameMode === 'blitz' && score > blitzHighScore) {
      setBlitzHighScore(score);
      try {
        localStorage.setItem(BLITZ_HIGH_SCORE_KEY, String(score));
      } catch {
        // ignore
      }
    }
  }, [score, highScore, blitzHighScore, gameMode]);

  // Sözlük güncellendiğinde tahtada hazır kelime varsa patlat
  useEffect(() => {
    const existingMatches = scanEntireBoard(grid);
    if (existingMatches.length === 0) return;

    const nextGrid = grid.map((row) => [...row]);
    const nextMeta = cellMeta.map((row) => [...row]);
    const uniqueCellsMap = new Map();
    const blastOverlay = {};

    existingMatches.forEach((m) => {
      m.coords.forEach((coord) => {
        const k = `${coord.r}-${coord.c}`;
        uniqueCellsMap.set(k, coord);
        blastOverlay[k] = nextGrid[coord.r][coord.c];
      });
    });

    uniqueCellsMap.forEach(({ r: br, c: bc }) => {
      nextGrid[br][bc] = null;
      nextMeta[br][bc] = null;
    });

    const earnedPoints = existingMatches.reduce((sum, m) => sum + m.baseScore, 0);
    const matchedWordNames = existingMatches.map((m) => m.word);
    const firstCoord = existingMatches[0].coords[0];

    setGrid(nextGrid);
    setCellMeta(nextMeta);
    setScore((prev) => prev + earnedPoints);
    setCoins((prev) => prev + existingMatches.length * 15);
    setWordsFoundCount((prev) => prev + existingMatches.length);
    setRecentWords((prev) => [...matchedWordNames, ...prev].slice(0, 8));
    setBlastingCells(blastOverlay);
    setTimeout(() => setBlastingCells({}), 360);

    soundEngine.playWordBlast(1, existingMatches.length);
    triggerCanvasWordBlast(Array.from(uniqueCellsMap.values()), 1, false);
    spawnFloatingText(
      `${matchedWordNames.join(' • ')} +${earnedPoints}`,
      '+15 ALTIN',
      firstCoord.r,
      firstCoord.c,
      false
    );
  }, [grid, cellMeta, dictionaryVersion, triggerCanvasWordBlast, spawnFloatingText]);

  const currentRank = useMemo(() => getRankInfo(score), [score]);
  useEffect(() => {
    if (currentRank.level > prevRankLevelRef.current) {
      prevRankLevelRef.current = currentRank.level;
      soundEngine.playFanfare();
      setCoins((c) => c + 40);
      showToast(`👑 RÜTBE ATLADIN: ${currentRank.title.toLocaleUpperCase('tr-TR')} (+40 Altın!)`);
    }
  }, [currentRank, showToast]);

  useEffect(() => {
    if (score >= nextRewardThresholdRef.current) {
      let grantedRefresh = 0;
      let grantedEraser = 0;
      let grantedHint = 0;

      while (score >= nextRewardThresholdRef.current) {
        nextRewardThresholdRef.current += 500;
        const roll = Math.random();
        if (roll < 0.36) {
          grantedRefresh += 1;
        } else if (roll < 0.72) {
          grantedEraser += 1;
        } else {
          grantedHint += 1;
        }
      }

      if (grantedRefresh > 0) setRefreshCount((c) => c + grantedRefresh);
      if (grantedEraser > 0) setEraserCount((c) => c + grantedEraser);
      if (grantedHint > 0) setHintCount((c) => c + grantedHint);

      const parts = [];
      if (grantedRefresh > 0) parts.push(`+${grantedRefresh} Yenile`);
      if (grantedEraser > 0) parts.push(`+${grantedEraser} Silici`);
      if (grantedHint > 0) parts.push(`+${grantedHint} İpucu`);

      showToast(`🎁 500 Puan Ödülü: ${parts.join(' & ')} Jokeri!`);
      soundEngine.playJokerSound('reward');
    }
  }, [score, showToast]);

  const resolveCellFromPoint = useCallback((clientX, clientY) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const effectiveY = clientY - 26;

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      effectiveY < rect.top ||
      effectiveY > rect.bottom
    ) {
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const c = Math.floor(((clientX - rect.left) / rect.width) * GRID_SIZE);
        const r = Math.floor(((clientY - rect.top) / rect.height) * GRID_SIZE);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          return { r, c };
        }
      }
      return null;
    }

    const c = Math.floor(((clientX - rect.left) / rect.width) * GRID_SIZE);
    const r = Math.floor(((effectiveY - rect.top) / rect.height) * GRID_SIZE);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      return { r, c };
    }
    return null;
  }, []);

  const checkHasEmptyCells = (board) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!board[r][c]) return true;
      }
    }
    return false;
  };

  const checkIsBoardCompletelyEmpty = (board) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] !== null) return false;
      }
    }
    return true;
  };

  const spawnNewTreasureChest = (board) => {
    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!board[r][c]) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  /**
   * ↩️ Son Hamleyi Geri Al (Undo)
   */
  const handleUndoLastMove = () => {
    if (!undoSnapshot || isGameOver) return;
    if (undoCount <= 0) {
      if (coins < 40) {
        showToast('Geri Al için 40 Altın gerekli!');
        return;
      }
      setCoins((c) => c - 40);
    } else {
      setUndoCount((u) => Math.max(0, u - 1));
    }

    soundEngine.playUndo();
    setGrid(undoSnapshot.grid);
    setCellMeta(undoSnapshot.cellMeta);
    setIceGrid(undoSnapshot.iceGrid);
    setTray(undoSnapshot.tray);
    setScore(undoSnapshot.score);
    setMovesLeft(undoSnapshot.movesLeft);
    setUndoSnapshot(null);
    setSelectedTileId(null);
    setActiveHint(null);
    showToast('↩️ Son Hamle Geri Alındı!');
  };

  /**
   * Taşı tahtaya yerleştir:
   * - Geri Al (Undo) için anlık durumu yedekler
   * - Kelime, Bomba, Elmas, Hazine Sandığı, Kristal Buz Kırma ve Bölüm Zaferi kontrollerini çalıştırır
   */
  const placeTileOnBoard = useCallback(
    (tileId, r, c) => {
      if (isGameOver || levelVictoryData) return false;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
      if (grid[r][c] !== null) return false;

      const tileObj = tray.find((t) => t.id === tileId && !t.placed);
      if (!tileObj) return false;

      // Geri Al (Undo) için mevcut durumu kaydet
      setUndoSnapshot({
        grid: grid.map((row) => [...row]),
        cellMeta: cellMeta.map((row) => [...row]),
        iceGrid: iceGrid.map((row) => [...row]),
        tray: tray.map((t) => ({ ...t })),
        score,
        movesLeft
      });

      const effectiveSyllable =
        tileObj.powerType === 'wildcard' || tileObj.syllable === '*'
          ? resolveWildcardSyllableForCell(grid, r, c)
          : tileObj.syllable;

      const nextGrid = grid.map((row) => [...row]);
      const nextMeta = cellMeta.map((row) => [...row]);
      const nextIce = iceGrid.map((row) => [...row]);
      nextGrid[r][c] = effectiveSyllable;
      nextMeta[r][c] = tileObj.powerType || null;

      const matches = scanRowAndColForWords(nextGrid, r, c);
      setActiveHint(null);
      setInspectedCell(null);

      const isCurrentlyFever = feverTurnsLeft > 0;
      const placedScreenPt = getCellScreenCenter(r, c);
      let nextScoreValue = score;
      let nextWordsFoundValue = wordsFoundCount;

      if (matches.length > 0) {
        const nextStreak = streakCombo + 1;
        const intersectionBonus = matches.length > 1 ? matches.length - 1 : 0;
        const totalMultiplier = nextStreak + intersectionBonus;

        setStreakCombo(nextStreak);
        setActiveMultiplier(totalMultiplier);
        setMaxComboReached((prev) => Math.max(prev, totalMultiplier));

        let triggeredFeverNow = false;
        if (!isCurrentlyFever) {
          const nextCharge = feverCharge + matches.length;
          if (nextCharge >= 4) {
            triggeredFeverNow = true;
            setFeverCharge(4);
            setFeverTurnsLeft(5);
            unlockAchievement('fever_trigger');
          } else {
            setFeverCharge(nextCharge);
          }
        } else {
          setFeverTurnsLeft((t) => Math.max(0, t - 1));
        }

        triggerCallout(totalMultiplier, triggeredFeverNow || isCurrentlyFever);
        unlockAchievement('first_word');
        if (totalMultiplier >= 3) {
          unlockAchievement('combo_3');
        }

        const uniqueCellsMap = new Map();
        const blastOverlay = {};
        let hasBombBlast = false;
        let hasDiamondMultiplier = false;

        matches.forEach((m) => {
          m.coords.forEach((coord) => {
            const key = `${coord.r}-${coord.c}`;
            uniqueCellsMap.set(key, coord);
            blastOverlay[key] = nextGrid[coord.r][coord.c];

            const metaType = nextMeta[coord.r][coord.c];
            if (metaType === 'bomb') hasBombBlast = true;
            if (metaType === 'diamond') hasDiamondMultiplier = true;
          });
        });

        // 💣 BOMBA TAŞ ETKİSİ: 3x3 çevresini havaya uçur!
        if (hasBombBlast) {
          const currentCoords = Array.from(uniqueCellsMap.values());
          currentCoords.forEach(({ r: br, c: bc }) => {
            if (nextMeta[br][bc] === 'bomb') {
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = br + dr;
                  const nc = bc + dc;
                  if (
                    nr >= 0 &&
                    nr < GRID_SIZE &&
                    nc >= 0 &&
                    nc < GRID_SIZE &&
                    nextGrid[nr][nc]
                  ) {
                    const nKey = `${nr}-${nc}`;
                    uniqueCellsMap.set(nKey, { r: nr, c: nc });
                    blastOverlay[nKey] = nextGrid[nr][nc];
                  }
                }
              }
            }
          });
        }

        uniqueCellsMap.forEach(({ r: br, c: bc }) => {
          nextGrid[br][bc] = null;
          nextMeta[br][bc] = null;
        });

        // ❄️ KRİSTAL BUZ HÜCRESİ KIRMA KONTROLÜ:
        // Patlayan hücrelerin kendisinde veya dikey/yatay komşusunda buz varsa kırılır!
        let iceBrokenNow = 0;
        for (const { r: br, c: bc } of uniqueCellsMap.values()) {
          const checkCoords = [
            { r: br, c: bc },
            { r: br - 1, c: bc },
            { r: br + 1, c: bc },
            { r: br, c: bc - 1 },
            { r: br, c: bc + 1 }
          ];
          for (const ic of checkCoords) {
            if (
              ic.r >= 0 &&
              ic.r < GRID_SIZE &&
              ic.c >= 0 &&
              ic.c < GRID_SIZE &&
              nextIce[ic.r][ic.c]
            ) {
              nextIce[ic.r][ic.c] = false;
              iceBrokenNow++;
              const icePt = getCellScreenCenter(ic.r, ic.c);
              vfxManager.spawnIceShatterVfx(icePt.x, icePt.y);
            }
          }
        }

        if (iceBrokenNow > 0) {
          soundEngine.playIceShatter();
          unlockAchievement('ice_breaker');
        }

        // 🔥 ATEŞ MODU VEYA X2 KOMBO ŞİMŞEĞİ
        let struckLightningCell = false;
        if (isCurrentlyFever || triggeredFeverNow || totalMultiplier >= 2) {
          const remainingFilled = [];
          for (let rr = 0; rr < GRID_SIZE; rr++) {
            for (let cc = 0; cc < GRID_SIZE; cc++) {
              if (nextGrid[rr][cc]) remainingFilled.push({ r: rr, c: cc });
            }
          }
          if (remainingFilled.length > 0) {
            const luckyKill = remainingFilled[Math.floor(Math.random() * remainingFilled.length)];
            const lkKey = `${luckyKill.r}-${luckyKill.c}`;
            blastOverlay[lkKey] = nextGrid[luckyKill.r][luckyKill.c];
            uniqueCellsMap.set(lkKey, luckyKill);
            nextGrid[luckyKill.r][luckyKill.c] = null;
            nextMeta[luckyKill.r][luckyKill.c] = null;
            struckLightningCell = true;
          }
        }

        // 🎁 HAZİNE SANDIĞI KONTROLÜ
        let chestOpened = false;
        if (treasureChest) {
          for (const { r: br, c: bc } of uniqueCellsMap.values()) {
            if (Math.abs(br - treasureChest.r) <= 1 && Math.abs(bc - treasureChest.c) <= 1) {
              chestOpened = true;
              break;
            }
          }
        }

        const rawPoints = matches.reduce((sum, m) => sum + m.baseScore, 0);
        const feverFactor = isCurrentlyFever || triggeredFeverNow ? 2 : 1;
        const diamondFactor = hasDiamondMultiplier ? 2 : 1;
        let earnedPoints = rawPoints * totalMultiplier * feverFactor * diamondFactor;
        let earnedCoins = matches.length * 15 * totalMultiplier * diamondFactor;

        if (iceBrokenNow > 0) {
          earnedPoints += iceBrokenNow * 100;
          earnedCoins += iceBrokenNow * 25;
        }

        if (hasBombBlast) {
          earnedPoints += 150;
          earnedCoins += 30;
        }

        if (chestOpened) {
          earnedPoints += 200;
          earnedCoins += 80;
          setRefreshCount((rc) => rc + 1);
          unlockAchievement('chest_hunter');
          setTreasureChest(null);
        } else if (!treasureChest && Math.random() < 0.45) {
          setTreasureChest(spawnNewTreasureChest(nextGrid));
        }

        const matchedWordNames = matches.map((m) => m.word);

        // Kalıcı Oyuncu İstatistiklerini Güncelle
        setLifetimeStats((prev) => {
          let longest = prev.longestWord || '';
          matchedWordNames.forEach((mw) => {
            if (mw.length > longest.length) longest = mw;
          });
          return {
            totalWords: prev.totalWords + matches.length,
            longestWord: longest,
            iceBroken: prev.iceBroken + iceBrokenNow,
            chestsOpened: prev.chestsOpened + (chestOpened ? 1 : 0)
          };
        });

        setDiscoveredWords((prev) => {
          const nextSet = new Set([...prev, ...matchedWordNames]);
          const arr = Array.from(nextSet);
          try {
            localStorage.setItem(DISCOVERED_WORDS_KEY, JSON.stringify(arr));
          } catch {
            // ignore
          }
          if (arr.length >= 20) {
            unlockAchievement('collector_20');
          }
          return arr;
        });

        let questCompleted = false;
        if (targetQuest && matchedWordNames.includes(targetQuest.word)) {
          questCompleted = true;
          earnedPoints += 250;
          earnedCoins += 50;
          setHintCount((h) => h + 1);
          setTargetQuest(pickRandomTargetWord(targetQuest.word));
        }

        const isFullClear = checkIsBoardCompletelyEmpty(nextGrid);
        if (isFullClear) {
          earnedPoints += 300;
          earnedCoins += 60;
          unlockAchievement('full_clear');
        }

        if (gameMode === 'blitz') {
          setTimeLeft((t) => Math.min(180, t + matches.length * 4));
        }

        nextScoreValue = score + earnedPoints;
        nextWordsFoundValue = wordsFoundCount + matches.length;

        setScore(nextScoreValue);
        setCoins((prev) => prev + earnedCoins);
        setWordsFoundCount(nextWordsFoundValue);
        setRecentWords((prev) => [...matchedWordNames, ...prev].slice(0, 8));

        if (hasBombBlast) {
          soundEngine.playExplosion();
        } else if (chestOpened) {
          soundEngine.playChestOpen();
        } else if (isFullClear || questCompleted || triggeredFeverNow) {
          soundEngine.playFanfare();
        } else {
          soundEngine.playWordBlast(totalMultiplier, matches.length);
        }

        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 440);

        setBlastingCells(blastOverlay);
        setTimeout(() => setBlastingCells({}), 360);

        triggerCanvasWordBlast(
          Array.from(uniqueCellsMap.values()),
          totalMultiplier,
          hasBombBlast || struckLightningCell
        );

        const labelWords = matchedWordNames.join(' • ');
        let subtext = `+${earnedCoins} 🪙`;
        if (iceBrokenNow > 0) {
          subtext = `❄️ ${iceBrokenNow} BUZ KIRILDI! +${earnedCoins}🪙`;
        } else if (chestOpened) {
          subtext = '🎁 SANDIK AÇILDI: +80🪙 & +1 YENİLE!';
        } else if (hasBombBlast) {
          subtext = '💣 3x3 BOMBA PATLAMASI!';
        } else if (hasDiamondMultiplier) {
          subtext = `💎 2X ELMAS BONUSU • +${earnedCoins}🪙`;
        } else if (isCurrentlyFever || triggeredFeverNow) {
          subtext = `🔥 ATEŞ MODU x2 • +${earnedCoins}🪙`;
        } else if (struckLightningCell) {
          subtext = `⚡ ŞİMŞEK BONUS TAŞ SİLDİ • +${earnedCoins}🪙`;
        }

        spawnFloatingText(`${labelWords} +${earnedPoints}`, subtext, r, c, true);
      } else {
        soundEngine.playPlaceTile();
        vfxManager.spawnPlaceEffect(placedScreenPt.x, placedScreenPt.y, '#38bdf8');
        setStreakCombo(0);
        setActiveMultiplier(1);
        if (isCurrentlyFever) {
          setFeverTurnsLeft((t) => {
            const nextT = Math.max(0, t - 1);
            if (nextT === 0) setFeverCharge(0);
            return nextT;
          });
        } else {
          setFeverCharge((cVal) => Math.max(0, cVal - 1));
        }

        if (treasureChest && treasureChest.r === r && treasureChest.c === c) {
          setTreasureChest(spawnNewTreasureChest(nextGrid));
        }
      }

      const updatedTray = tray.map((t) => (t.id === tileId ? { ...t, placed: true } : t));
      const allPlaced = updatedTray.every((t) => t.placed);

      setGrid(nextGrid);
      setCellMeta(nextMeta);
      setIceGrid(nextIce);
      setSelectedTileId(null);
      setEraserActive(false);

      if (allPlaced) {
        setTray(generateSmartTray(nextGrid));
      } else {
        setTray(updatedTray);
      }

      // 🗺️ BÖLÜM MODU (CAMPAIGN) ZAFER & HAMLE KONTROLÜ
      const nextMovesLeft = Math.max(0, movesLeft - 1);
      if (gameMode === 'campaign') {
        setMovesLeft(nextMovesLeft);
        const remainingIce = countRemainingIce(nextIce);
        const isScoreDone = nextScoreValue >= activeLevelConfig.targetScore;
        const isWordsDone = nextWordsFoundValue >= activeLevelConfig.targetWords;
        const isIceDone = remainingIce === 0;

        if (isIceDone && (isScoreDone || isWordsDone)) {
          // 🎉 BÖLÜM TAMAMLANDI!
          const starsEarned = nextMovesLeft >= 5 ? 3 : nextMovesLeft >= 2 ? 2 : 1;
          const bonusCoins = activeLevelConfig.rewardCoins + nextMovesLeft * 10;

          setTimeout(() => {
            soundEngine.playFanfare();
            vfxManager.spawnVictoryConfetti(window.innerWidth, window.innerHeight);
            setCoins((cVal) => cVal + bonusCoins);
            setCampaignProgress((prev) => ({
              currentLevel: prev.currentLevel,
              maxUnlockedLevel: Math.max(prev.maxUnlockedLevel, prev.currentLevel + 1),
              starsByLevel: {
                ...prev.starsByLevel,
                [prev.currentLevel]: Math.max(
                  prev.starsByLevel?.[prev.currentLevel] || 0,
                  starsEarned
                )
              }
            }));
            setLevelVictoryData({
              level: activeLevelConfig.level,
              stars: starsEarned,
              rewardCoins: bonusCoins,
              score: nextScoreValue
            });
          }, 340);
          return true;
        }

        if (nextMovesLeft <= 0 || !checkHasEmptyCells(nextGrid)) {
          setTimeout(() => {
            soundEngine.playGameOver();
            setIsGameOver(true);
          }, 320);
          return true;
        }
      } else if (!checkHasEmptyCells(nextGrid)) {
        setTimeout(() => {
          soundEngine.playGameOver();
          setIsGameOver(true);
        }, 320);
      }

      return true;
    },
    [
      grid,
      cellMeta,
      iceGrid,
      treasureChest,
      feverCharge,
      feverTurnsLeft,
      tray,
      streakCombo,
      score,
      wordsFoundCount,
      movesLeft,
      activeLevelConfig,
      isGameOver,
      levelVictoryData,
      targetQuest,
      gameMode,
      getCellScreenCenter,
      triggerCallout,
      unlockAchievement,
      triggerCanvasWordBlast,
      spawnFloatingText
    ]
  );

  const handleSecondChanceRevive = () => {
    if (coins < 100) {
      showToast('Diriliş için 100 Altın gerekli!');
      return;
    }
    setCoins((c) => c - 100);

    const nextGrid = grid.map((row) => [...row]);
    const nextMeta = cellMeta.map((row) => [...row]);
    const blastedCoords = [];

    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 3; c++) {
        if (nextGrid[r][c]) {
          blastedCoords.push({ r, c });
        }
        nextGrid[r][c] = null;
        nextMeta[r][c] = null;
      }
    }

    setGrid(nextGrid);
    setCellMeta(nextMeta);
    setTray(generateSmartTray(nextGrid));
    if (gameMode === 'blitz') {
      setTimeLeft(45);
    } else if (gameMode === 'campaign') {
      setMovesLeft((m) => m + 8);
    }
    setIsGameOver(false);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    soundEngine.playExplosion();
    triggerCanvasWordBlast(
      blastedCoords.length > 0 ? blastedCoords : [{ r: 2, c: 2 }],
      3,
      true
    );
    spawnFloatingText('İKİNCİ ŞANS!', 'MERKEZ 9 TAŞ TEMİZLENDİ!', 2, 2, true);
  };

  const handleEraseCell = (r, c) => {
    if (!eraserActive) return;
    const currentSyl = grid[r][c];
    if (!currentSyl) return;

    if (eraserCount <= 0) {
      if (coins < 75) return;
      setCoins((prev) => prev - 75);
    } else {
      setEraserCount((cCount) => Math.max(0, cCount - 1));
    }

    const nextGrid = grid.map((row) => [...row]);
    const nextMeta = cellMeta.map((row) => [...row]);
    nextGrid[r][c] = null;
    nextMeta[r][c] = null;

    setGrid(nextGrid);
    setCellMeta(nextMeta);
    setEraserActive(false);
    setActiveHint(null);

    soundEngine.playJokerSound('erase');
    triggerCanvasWordBlast([{ r, c }], 1, true);
    spawnFloatingText(`${currentSyl} SİLİNDİ`, 'TAŞ SİLİCİ', r, c, false);
  };

  const handleRefreshTray = () => {
    if (isGameOver) return;
    if (refreshCount <= 0) {
      if (coins < 50) {
        showToast('Yeterli Altın Yok! Kelime patlatarak altın kazan.');
        return;
      }
      setCoins((c) => c - 50);
    } else {
      setRefreshCount((c) => Math.max(0, c - 1));
    }

    soundEngine.playJokerSound('refresh');
    setSelectedTileId(null);
    setEraserActive(false);
    setActiveHint(null);
    setTray(generateSmartTray(grid));
  };

  const handleTriggerHint = () => {
    if (isGameOver) return;
    const best = findBestMoveForTray(grid, tray);
    if (!best) return;

    if (hintCount <= 0) {
      if (coins < 60) {
        showToast('Yeterli Altın Yok! Kelime patlatarak altın kazan.');
        return;
      }
      setCoins((c) => c - 60);
    } else {
      setHintCount((c) => Math.max(0, c - 1));
    }

    soundEngine.playJokerSound('hint');
    setEraserActive(false);
    setSelectedTileId(best.tileId);
    setActiveHint(best);
    const pt = getCellScreenCenter(best.r, best.c);
    vfxManager.spawnPlaceEffect(pt.x, pt.y, '#34d399');
  };

  const handleRestartGame = (newMode = gameMode, targetCampaignLevel = null) => {
    const freshGrid = createEmptyGrid();
    const chosenLevelNum =
      targetCampaignLevel !== null ? targetCampaignLevel : campaignProgress.currentLevel;
    const lvlCfg = getCampaignLevelConfig(chosenLevelNum);

    if (targetCampaignLevel !== null) {
      setCampaignProgress((prev) => ({ ...prev, currentLevel: chosenLevelNum }));
    }

    setGameMode(newMode);
    setTimeLeft(120);
    setMovesLeft(lvlCfg.maxMoves);
    setLevelVictoryData(null);
    setUndoSnapshot(null);
    setGrid(freshGrid);
    setCellMeta(createEmptyMetaGrid());
    setIceGrid(
      newMode === 'campaign'
        ? createIceGridFromCoords(lvlCfg.iceCoords)
        : createIceGridFromCoords([
            { r: 1, c: 1 },
            { r: 3, c: 3 }
          ])
    );
    setTreasureChest({ r: 2, c: 2 });
    setFeverCharge(0);
    setFeverTurnsLeft(0);
    setTray(generateSmartTray(freshGrid));
    setSelectedTileId(null);
    setEraserActive(false);
    setActiveHint(null);
    setInspectedCell(null);
    setScore(0);
    setDisplayScore(0);
    setWordsFoundCount(0);
    setRecentWords([]);
    setStreakCombo(0);
    setActiveMultiplier(1);
    setMaxComboReached(1);
    setRefreshCount(2);
    setEraserCount(2);
    setHintCount(2);
    setUndoCount(2);
    setTargetQuest(pickRandomTargetWord());
    nextRewardThresholdRef.current = 500;
    prevRankLevelRef.current = 1;
    setIsGameOver(false);
    try {
      localStorage.removeItem(SAVED_STATE_KEY);
    } catch {
      // ignore
    }
    soundEngine.playSelect();
  };

  const handleShareScore = () => {
    const shareText = `🔥 HECE ZİNCİRİ PRO\n🏆 Skor: ${score} (Rekor: ${highScore})\n👑 Rütbe: ${currentRank.title}\n📚 Keşfedilen TDK Kelimesi: ${discoveredWords.length}\nSen de oyna!`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText);
        showToast('📋 Skor Kartın Panoya Kopyalandı!');
      }
    } catch {
      showToast('📋 Skor Kartın Hazır!');
    }
  };

  const handleBuyOrSelectTheme = (themeObj) => {
    if (unlockedThemes.includes(themeObj.id)) {
      setActiveTheme(themeObj.id);
      try {
        localStorage.setItem(ACTIVE_THEME_KEY, themeObj.id);
      } catch {
        // ignore
      }
      soundEngine.playSelect();
      return;
    }
    if (coins < themeObj.price) {
      showToast(`Bu tema için ${themeObj.price} Altın gerekli!`);
      return;
    }
    setCoins((c) => c - themeObj.price);
    const nextUnlocked = [...unlockedThemes, themeObj.id];
    setUnlockedThemes(nextUnlocked);
    setActiveTheme(themeObj.id);
    try {
      localStorage.setItem(UNLOCKED_THEMES_KEY, JSON.stringify(nextUnlocked));
      localStorage.setItem(ACTIVE_THEME_KEY, themeObj.id);
    } catch {
      // ignore
    }
    soundEngine.playFanfare();
    showToast(`🎨 ${themeObj.name} Teması Açıldı!`);
  };

  const handleAddCustomWord = (e) => {
    e.preventDefault();
    if (!customWordInput.trim()) return;
    const res = registerCustomTurkishWord(customWordInput);
    if (!res.ok) {
      setCustomWordFeedback({ ok: false, text: res.error });
      return;
    }
    setCustomWordInput('');
    setDictionaryVersion((v) => v + 1);
    soundEngine.playJokerSound('reward');
    setCustomWordFeedback({
      ok: true,
      text: res.alreadyExists
        ? `${res.entry.key} (${res.entry.word}) zaten sözlükte mevcut!`
        : `${res.entry.key} (${res.entry.word}) sözlüğe eklendi!`
    });
  };

  const handleTilePointerDown = (e, tile) => {
    if (tile.placed || isGameOver || levelVictoryData) return;
    e.preventDefault();
    e.stopPropagation();

    setEraserActive(false);
    setInspectedCell(null);
    soundEngine.playSelect();

    dragMovedRef.current = false;
    const targetCell = resolveCellFromPoint(e.clientX, e.clientY);

    setDragState({
      tileId: tile.id,
      syllable: tile.syllable,
      powerType: tile.powerType,
      startX: e.clientX,
      startY: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
      targetCell
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      if (Math.hypot(dx, dy) > 8) {
        dragMovedRef.current = true;
      }

      vfxManager.spawnDragTrail(
        e.clientX,
        e.clientY - 24,
        dragState.powerType === 'wildcard' ? '#f43f5e' : '#38bdf8'
      );

      const targetCell = resolveCellFromPoint(e.clientX, e.clientY);
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              targetCell
            }
          : null
      );
    };

    const handlePointerUp = (e) => {
      vfxManager.clearDragTrail();
      const targetCell = resolveCellFromPoint(e.clientX, e.clientY);

      if (dragMovedRef.current && targetCell && grid[targetCell.r][targetCell.c] === null) {
        placeTileOnBoard(dragState.tileId, targetCell.r, targetCell.c);
      } else if (!dragMovedRef.current) {
        setSelectedTileId((prevId) => (prevId === dragState.tileId ? null : dragState.tileId));
      } else {
        setSelectedTileId(dragState.tileId);
      }

      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, grid, resolveCellFromPoint, placeTileOnBoard]);

  const handleCellClick = (r, c) => {
    if (isGameOver || levelVictoryData) return;

    if (eraserActive) {
      if (grid[r][c] !== null) {
        handleEraseCell(r, c);
      }
      return;
    }

    if (selectedTileId && grid[r][c] === null) {
      placeTileOnBoard(selectedTileId, r, c);
      return;
    }

    if (grid[r][c] !== null) {
      soundEngine.playSelect();
      const pt = getCellScreenCenter(r, c);
      vfxManager.spawnPlaceEffect(pt.x, pt.y, '#fde047');
      const syl = grid[r][c];
      const hints = getTacticalCompletionHints(syl);
      setInspectedCell((prev) =>
        prev && prev.r === r && prev.c === c ? null : { r, c, syllable: syl, hints }
      );
    } else {
      setInspectedCell(null);
    }
  };

  const activeTileObj =
    (dragState && tray.find((t) => t.id === dragState.tileId)) ||
    tray.find((t) => t.id === selectedTileId && !t.placed) ||
    null;

  const hoveredCell =
    dragState?.targetCell && grid[dragState.targetCell.r][dragState.targetCell.c] === null
      ? dragState.targetCell
      : null;

  const activePreviewSyllable = useMemo(() => {
    if (!activeTileObj) return null;
    if (
      (activeTileObj.powerType === 'wildcard' || activeTileObj.syllable === '*') &&
      hoveredCell
    ) {
      return resolveWildcardSyllableForCell(grid, hoveredCell.r, hoveredCell.c);
    }
    return activeTileObj.syllable;
  }, [activeTileObj, hoveredCell, grid]);

  const previewBlastCoordsSet = new Set();
  const previewMatchedWords = [];
  if (hoveredCell && activePreviewSyllable && activePreviewSyllable !== '*') {
    const tempGrid = grid.map((row) => [...row]);
    tempGrid[hoveredCell.r][hoveredCell.c] = activePreviewSyllable;
    const previewMatches = scanRowAndColForWords(tempGrid, hoveredCell.r, hoveredCell.c);
    previewMatches.forEach((m) => {
      previewMatchedWords.push(m.word);
      m.coords.forEach((coord) => previewBlastCoordsSet.add(`${coord.r}-${coord.c}`));
    });
  }

  const isFeverActive = feverTurnsLeft > 0;
  const remainingIceCount = useMemo(() => countRemainingIce(iceGrid), [iceGrid]);

  const filteredDictionary = useMemo(() => {
    return searchTdkDictionary(dictSearch, dictFilter, discoveredWords, 260);
  }, [dictSearch, dictFilter, discoveredWords, dictionaryVersion]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative flex flex-col justify-between items-center w-full h-full max-w-md mx-auto px-3 py-1.5 select-none overflow-hidden bg-[#0b1120]">
      {/* TAM EKRAN 60 FPS HTML5 CANVAS VFX KATMANI */}
      <canvas
        ref={vfxCanvasRef}
        className="pointer-events-none fixed inset-0 z-40 w-full h-full"
      />

      {/* Atmosferik Arka Plan Işıltıları */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-28 -left-24 w-80 h-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div
          className={`absolute top-1/3 -right-28 w-80 h-80 rounded-full blur-3xl transition-colors duration-700 ${
            isFeverActive ? 'bg-rose-500/30' : 'bg-amber-500/15'
          }`}
        />
        <div className="absolute -bottom-28 left-1/4 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      {/* Üst Bildirim Toast'u */}
      {jokerToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 text-slate-950 font-black text-xs shadow-2xl border border-white/60 animate-bounce whitespace-nowrap">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{jokerToast}</span>
        </div>
      )}

      {/* App Store Övgü Rozeti */}
      {calloutBadge && (
        <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-1.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-white font-black text-sm sm:text-base tracking-wider shadow-2xl border-2 border-white/80 animate-popIn whitespace-nowrap">
          {calloutBadge}
        </div>
      )}

      {/* 1. APP STORE ÜST HUD */}
      <header className="w-full flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRestartGame(gameMode)}
            title="Yeni Oyun Başlat"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 font-black text-slate-950 text-sm tracking-tighter border border-white/40 active:scale-95 transition"
          >
            HZ
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
                HECE ZİNCİRİ
              </h1>
              <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black uppercase shadow-sm">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-300">
                Sv.{currentRank.level} {currentRank.title}
              </span>
              <div className="w-9 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${currentRank.progress}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Üst: Altın, Harita, Tema, Başarımlar, Sözlük, Müzik, Ses */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowThemeShopModal(true)}
            title="Altın & Tema Mağazası"
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-300 active:scale-95 transition"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-black tabular-nums">{coins}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCampaignMapModal(true)}
            title="Bölüm Haritası (Seferberlik)"
            className="p-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-emerald-400 active:scale-95 transition"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowThemeShopModal(true)}
            title="Tema & Taş Mağazası"
            className="p-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-fuchsia-400 active:scale-95 transition"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowAchievementsModal(true)}
            title="Başarımlar & İstatistikler"
            className="p-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-amber-400 active:scale-95 transition relative"
          >
            <Medal className="w-4 h-4" />
            {unlockedAchievements.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 font-black text-[8px] flex items-center justify-center">
                {unlockedAchievements.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDictionaryModal(true)}
            title="TDK Tam Sözlük (59.855+ Kelime)"
            className="p-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-sky-400 active:scale-95 transition"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMusicOn(soundEngine.toggleAmbientMusic())}
            title={isMusicOn ? 'Zen Müziğini Kapat' : 'Zen Arka Plan Müziğini Aç'}
            className={`p-1.5 rounded-xl border active:scale-95 transition ${
              isMusicOn
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 shadow-sm shadow-indigo-500/30'
                : 'bg-slate-900/95 hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMute = soundEngine.toggleMute();
              setIsMuted(nextMute);
              if (nextMute) setIsMusicOn(false);
            }}
            aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            className={`p-1.5 rounded-xl border active:scale-95 transition ${
              isMuted
                ? 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                : 'bg-slate-900/95 hover:bg-slate-800 border-slate-800 text-emerald-400'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. SKORBOARD, 3 OYUN MODU (KLASİK / BÖLÜM / BLITZ) VE GÖREV KARTI */}
      <div className="w-full grid grid-cols-12 gap-1.5">
        <div className="col-span-5 flex flex-col justify-between p-1.5 rounded-xl bg-slate-900/95 border border-slate-800/90">
          <div className="grid grid-cols-3 gap-0.5">
            <button
              type="button"
              onClick={() => gameMode !== 'classic' && handleRestartGame('classic')}
              className={`flex items-center justify-center gap-0.5 py-1 rounded-lg text-[9px] font-black transition ${
                gameMode === 'classic'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <InfinityIcon className="w-2.5 h-2.5" />
              <span>Klasik</span>
            </button>
            <button
              type="button"
              onClick={() =>
                gameMode !== 'campaign'
                  ? handleRestartGame('campaign', campaignProgress.currentLevel)
                  : setShowCampaignMapModal(true)
              }
              className={`flex items-center justify-center gap-0.5 py-1 rounded-lg text-[9px] font-black transition ${
                gameMode === 'campaign'
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-2.5 h-2.5" />
              <span>Bölüm</span>
            </button>
            <button
              type="button"
              onClick={() => gameMode !== 'blitz' && handleRestartGame('blitz')}
              className={`flex items-center justify-center gap-0.5 py-1 rounded-lg text-[9px] font-black transition ${
                gameMode === 'blitz'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Timer className="w-2.5 h-2.5" />
              <span>Blitz</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-bold text-slate-400">
            <span>
              {gameMode === 'blitz'
                ? 'SÜRE'
                : gameMode === 'campaign'
                ? `BÖLÜM ${activeLevelConfig.level}`
                : 'REKOR'}
            </span>
            <span
              className={`font-black tabular-nums ${
                (gameMode === 'blitz' && timeLeft <= 20) ||
                (gameMode === 'campaign' && movesLeft <= 3)
                  ? 'text-rose-400 animate-pulse'
                  : 'text-slate-200'
              }`}
            >
              {gameMode === 'blitz'
                ? formatTimer(timeLeft)
                : gameMode === 'campaign'
                ? `${movesLeft} Hamle`
                : highScore}
            </span>
          </div>
        </div>

        {/* Merkez Skor & Ateş Modu */}
        <div
          ref={scoreCardRef}
          className={`col-span-3 flex flex-col items-center justify-center p-1.5 rounded-xl border relative overflow-hidden transition-all duration-150 ${
            scoreBoxPulse ? 'scale-110 ring-2 ring-amber-300' : 'scale-100'
          } ${
            isFeverActive
              ? 'bg-gradient-to-b from-rose-950/90 to-amber-950/90 border-amber-400 shadow-lg shadow-rose-500/20'
              : 'bg-slate-900/95 border-slate-800/90'
          }`}
        >
          <div className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 leading-none">
            {isFeverActive ? `🔥 ATEŞ (${feverTurnsLeft})` : 'SKOR'}
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400 leading-tight tabular-nums">
            {displayScore}
          </div>
          <div className="w-full flex items-center gap-0.5 mt-1 px-0.5">
            {[1, 2, 3, 4].map((step) => {
              const active = isFeverActive || feverCharge >= step;
              return (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    active
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-sm shadow-amber-400'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Sağ: Hedef Görev veya Bölüm Hedefi */}
        <div className="col-span-4 flex flex-col justify-between p-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          {gameMode === 'campaign' ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase text-emerald-300 flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-emerald-400" /> HEDEF
                </span>
                <span className="text-[9px] font-black text-amber-300">
                  +{activeLevelConfig.rewardCoins}🪙
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black text-white mt-0.5">
                <span className="flex items-center gap-0.5 text-sky-300">
                  <Snowflake className="w-3 h-3" /> {remainingIceCount} Buz
                </span>
                <span className="text-amber-300">
                  {wordsFoundCount}/{activeLevelConfig.targetWords} Kelime
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase text-indigo-300 flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-indigo-400" /> GÖREV
                </span>
                <span className="text-[9px] font-black text-amber-300">+250P</span>
              </div>
              {targetQuest && (
                <div className="flex items-center justify-center gap-0.5 my-auto flex-wrap">
                  {targetQuest.syllables.map((s, idx) => (
                    <span
                      key={`${s}-${idx}`}
                      className="px-1.5 py-0.5 rounded bg-indigo-500/30 border border-indigo-400/40 text-white font-black text-[10px] leading-none"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. MERKEZ 5x5 OYUN IZGARASI (GRID) */}
      <div className="relative w-full flex-1 flex items-center justify-center my-0.5">
        <div
          ref={boardRef}
          className={`relative w-full max-w-[342px] aspect-square p-2.5 rounded-2xl bg-slate-900/95 border-2 transition-all ${
            isFeverActive ? 'fever-board-glow' : 'border-slate-800/90 shadow-2xl'
          } ${isShaking ? 'animate-shake' : ''} ${
            eraserActive ? 'ring-2 ring-rose-500/80' : ''
          }`}
        >
          {/* Sürükleme esnasında kelime patlayacaksa üstte canlı önizleme etiketi */}
          {previewMatchedWords.length > 0 && (
            <div className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-xs shadow-lg border border-white animate-bounce whitespace-nowrap">
              ⚡ {previewMatchedWords.join(' + ')} PATLAYACAK!
            </div>
          )}

          {/* Taktiksel Tuzak İpucu Bandı */}
          {inspectedCell && previewMatchedWords.length === 0 && (
            <div className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-3 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black text-[11px] shadow-lg border border-white whitespace-nowrap max-w-[95%] truncate">
              🔍 {inspectedCell.syllable} yanına:{' '}
              {[...inspectedCell.hints.rightOrDown, ...inspectedCell.hints.leftOrUp]
                .slice(0, 5)
                .join(', ') || 'Kombinasyon ara'}{' '}
              gelirse patlar!
            </div>
          )}

          {/* 5x5 Hücreler */}
          <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full">
            {grid.map((row, r) =>
              row.map((cellSyllable, c) => {
                const cellKey = `${r}-${c}`;
                const metaType = cellMeta[r][c];
                const isFrozen = Boolean(iceGrid?.[r]?.[c]);
                const isChestHere =
                  !cellSyllable &&
                  !isFrozen &&
                  treasureChest &&
                  treasureChest.r === r &&
                  treasureChest.c === c;
                const isHoveredTarget = hoveredCell?.r === r && hoveredCell?.c === c;
                const isPreviewBlast = previewBlastCoordsSet.has(cellKey);
                const isHintTarget = activeHint?.r === r && activeHint?.c === c && !cellSyllable;
                const isInspected = inspectedCell?.r === r && inspectedCell?.c === c;
                const blastingSyl = blastingCells[cellKey];
                const canPlaceByTap = Boolean(selectedTileId && !cellSyllable && !eraserActive);
                const canEraseCell = Boolean(eraserActive && cellSyllable);

                return (
                  <button
                    key={cellKey}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`relative w-full h-full rounded-xl flex items-center justify-center font-black select-none transition-all duration-150 ${
                      cellSyllable
                        ? `tile-gloss ${getTileThemeClass(cellSyllable, activeTheme, metaType)} ${
                            isFrozen ? 'ice-tile-overlay' : ''
                          } ${
                            canEraseCell
                              ? 'ring-2 ring-rose-400 animate-pulse cursor-pointer'
                              : isInspected
                              ? 'ring-2 ring-sky-300 scale-105'
                              : 'cursor-pointer'
                          }`
                        : isHoveredTarget
                        ? 'bg-amber-400/25 border-2 border-amber-400 scale-[1.05] shadow-lg shadow-amber-500/30'
                        : isHintTarget
                        ? 'bg-emerald-500/25 border-2 border-dashed border-emerald-400 animate-pulse cursor-pointer'
                        : isFrozen
                        ? 'ice-cell-slot'
                        : isChestHere
                        ? 'board-slot border-2 border-amber-400/60 bg-amber-500/10'
                        : canPlaceByTap
                        ? 'board-slot border border-sky-500/35 hover:border-sky-400/80 cursor-pointer'
                        : 'board-slot border border-slate-800/90'
                    } ${
                      isPreviewBlast
                        ? 'ring-2 ring-emerald-300 brightness-125 scale-[1.08] z-10'
                        : ''
                    }`}
                  >
                    {/* ❄️ Kristal Buz Rozeti */}
                    {isFrozen && (
                      <span
                        title="Kristal Buz: Bu hücrede veya komşusunda kelime patlatarak buzu kır (+100P & +25🪙)!"
                        className="absolute top-0.5 left-0.5 text-[10px] leading-none pointer-events-none"
                      >
                        ❄️
                      </span>
                    )}

                    {cellSyllable && metaType === 'bomb' && (
                      <span
                        title="Bomba Taş: Patladığında 3x3 çevresini havaya uçurur!"
                        className="absolute -top-1 -right-1 text-[11px] leading-none drop-shadow"
                      >
                        💣
                      </span>
                    )}
                    {cellSyllable && metaType === 'diamond' && (
                      <span
                        title="2x Elmas Taş: Puanı ve Altını ikiye katlar!"
                        className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-sky-400 text-slate-950 font-black text-[8px] leading-none shadow"
                      >
                        2x💎
                      </span>
                    )}

                    {cellSyllable && (
                      <span
                        className={`tracking-tight leading-none animate-popIn drop-shadow-sm ${
                          cellSyllable.length >= 4
                            ? 'text-sm sm:text-base'
                            : cellSyllable.length === 3
                            ? 'text-base sm:text-lg'
                            : 'text-lg sm:text-xl'
                        }`}
                      >
                        {cellSyllable}
                      </span>
                    )}

                    {isChestHere && !isHoveredTarget && (
                      <div
                        title="Hazine Sandığı: Yanında bir kelime patlatarak sandığı aç (+80 Altın & +1 Joker)!"
                        className="flex flex-col items-center animate-bounce"
                      >
                        <Gift className="w-5 h-5 text-amber-400" />
                        <span className="text-[7px] font-black text-amber-300 uppercase mt-0.5">
                          +80🪙
                        </span>
                      </div>
                    )}

                    {!cellSyllable && !isHoveredTarget && isHintTarget && (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-300/95">
                          {activeHint.syllable}
                        </span>
                        <span className="text-[8px] font-extrabold text-emerald-400 uppercase">
                          BURAYA
                        </span>
                      </div>
                    )}

                    {!cellSyllable && isHoveredTarget && activePreviewSyllable && (
                      <span className="text-base sm:text-lg font-black text-amber-300/95 tracking-tight">
                        {activePreviewSyllable}
                      </span>
                    )}

                    {blastingSyl && (
                      <div
                        className={`absolute inset-0 rounded-xl flex items-center justify-center font-black text-lg ${getTileThemeClass(
                          blastingSyl,
                          activeTheme
                        )} animate-blastOut pointer-events-none z-20`}
                      >
                        {blastingSyl}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Uçan Kelime ve Puan Yazıları */}
          <div className="pointer-events-none absolute inset-0 overflow-visible z-40">
            {floatingTexts.map((ft) => (
              <div
                key={ft.id}
                style={{ left: `${ft.xPct}%`, top: `${ft.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-floatUp whitespace-nowrap"
              >
                {ft.subtext && (
                  <span className="px-2.5 py-0.5 mb-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider shadow-lg border border-white/60">
                    {ft.subtext}
                  </span>
                )}
                <span
                  className={`px-3.5 py-1 rounded-xl font-black text-sm sm:text-base tracking-tight shadow-2xl border ${
                    ft.isCombo
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 text-slate-950 border-white'
                      : 'bg-emerald-400 text-slate-950 border-emerald-100'
                  }`}
                >
                  {ft.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. APP STORE 4'LÜ PROFESYONEL JOKER ARAÇ ÇUBUĞU (GERİ AL, YENİLE, İPUCU, SİLİCİ) */}
      <div className="w-full grid grid-cols-4 gap-1.5 my-0.5">
        {/* Geri Al (Undo) */}
        <button
          type="button"
          onClick={handleUndoLastMove}
          disabled={!undoSnapshot || (undoCount <= 0 && coins < 40) || isGameOver}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-bold text-[11px] border transition active:scale-95 ${
            undoSnapshot && (undoCount > 0 || coins >= 40)
              ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-amber-300 shadow-sm'
              : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Geri</span>
          {undoCount > 0 ? (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
              {undoCount}
            </span>
          ) : (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
              40🪙
            </span>
          )}
        </button>

        {/* Yenile */}
        <button
          type="button"
          onClick={handleRefreshTray}
          disabled={(refreshCount <= 0 && coins < 50) || isGameOver}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-bold text-[11px] border transition active:scale-95 ${
            refreshCount > 0 || coins >= 50
              ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-sky-300 shadow-sm'
              : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Yenile</span>
          {refreshCount > 0 ? (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-sky-500/20 text-sky-300">
              {refreshCount}
            </span>
          ) : (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
              50🪙
            </span>
          )}
        </button>

        {/* İpucu */}
        <button
          type="button"
          onClick={handleTriggerHint}
          disabled={(hintCount <= 0 && coins < 60) || isGameOver}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-bold text-[11px] border transition active:scale-95 ${
            activeHint
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
              : hintCount > 0 || coins >= 60
              ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-emerald-300 shadow-sm'
              : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">İpucu</span>
          {hintCount > 0 ? (
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-black ${
                activeHint ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {hintCount}
            </span>
          ) : (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
              60🪙
            </span>
          )}
        </button>

        {/* Silici */}
        <button
          type="button"
          onClick={() => {
            if ((eraserCount <= 0 && coins < 75) || isGameOver) return;
            soundEngine.playSelect();
            setSelectedTileId(null);
            setActiveHint(null);
            setEraserActive((prev) => !prev);
          }}
          disabled={(eraserCount <= 0 && coins < 75) || isGameOver}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-bold text-[11px] border transition active:scale-95 ${
            eraserActive
              ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
              : eraserCount > 0 || coins >= 75
              ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-rose-300 shadow-sm'
              : 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Eraser className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{eraserActive ? 'Seç' : 'Silici'}</span>
          {eraserCount > 0 ? (
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-black ${
                eraserActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {eraserCount}
            </span>
          ) : (
            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
              75🪙
            </span>
          )}
        </button>
      </div>

      {/* 5. ALTTAKİ 3 HECE TEPSİSİ */}
      <div className="w-full pb-1">
        <div className="w-full rounded-2xl bg-slate-900/95 border border-slate-800/90 px-3 py-2 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5 px-0.5">
            <span className="flex items-center gap-1 truncate">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {eraserActive
                ? 'Tahtadan silmek istediğin bir taşa dokun!'
                : activeHint
                ? activeHint.words.length > 0
                  ? `İpucu: "${activeHint.syllable}" → yeşil hücreye koy (${activeHint.words.join(', ')})!`
                  : `İpucu: "${activeHint.syllable}" taşını işaretli yeşil hücreye yerleştir!`
                : selectedTileId
                ? 'Şimdi tahtadaki boş bir hücreye dokun veya sürükle!'
                : '⚡ işaretli taşlar tahtada hemen kelime patlatmaya hazır!'}
            </span>
            <button
              type="button"
              onClick={() => setShowDictionaryModal(true)}
              className="text-sky-400 hover:text-sky-300 font-bold text-[10px] flex items-center gap-0.5 shrink-0 ml-2"
            >
              <PlusCircle className="w-3 h-3" />
              <span>TDK Sözlük</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 h-16 sm:h-[72px]">
            {tray.map((tile) => {
              const isSelected = selectedTileId === tile.id;
              const isBeingDragged = dragState?.tileId === tile.id;
              const isHintTile = activeHint?.tileId === tile.id;
              const isWildcard = tile.powerType === 'wildcard' || tile.syllable === '*';
              const isReadyToBlast = canTileBlastImmediately(grid, tile);

              if (tile.placed) {
                return (
                  <div
                    key={tile.id}
                    className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 flex items-center justify-center"
                  />
                );
              }

              return (
                <div
                  key={tile.id}
                  onPointerDown={(e) => handleTilePointerDown(e, tile)}
                  className={`relative rounded-xl flex flex-col items-center justify-center font-black cursor-grab active:cursor-grabbing select-none transition-all duration-150 tile-gloss ${getTileThemeClass(
                    tile.syllable,
                    activeTheme,
                    tile.powerType
                  )} ${
                    isSelected || isHintTile
                      ? 'ring-4 ring-white -translate-y-1.5 scale-105'
                      : isReadyToBlast
                      ? 'ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/25 hover:-translate-y-1'
                      : 'hover:-translate-y-0.5'
                  } ${isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100'}`}
                >
                  {tile.powerType === 'bomb' && (
                    <span className="absolute top-1 left-1.5 text-xs leading-none">💣</span>
                  )}
                  {tile.powerType === 'diamond' && (
                    <span className="absolute top-1 left-1.5 px-1 py-0.2 rounded bg-sky-400 text-slate-950 font-black text-[9px] leading-none shadow">
                      2x💎
                    </span>
                  )}
                  {isWildcard && (
                    <span className="absolute top-1 left-1.5 px-1 py-0.2 rounded bg-white/90 text-slate-950 font-black text-[8px] leading-none uppercase">
                      JOKER
                    </span>
                  )}
                  {isReadyToBlast && !isWildcard && (
                    <span
                      title="Bu taş tahtadaki bir kelimeyi hemen patlatabilir!"
                      className="absolute top-1 right-1 px-1 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-black text-[8px] leading-none shadow"
                    >
                      ⚡
                    </span>
                  )}
                  <span
                    className={`tracking-tight leading-none drop-shadow-sm ${
                      isWildcard
                        ? 'text-2xl sm:text-3xl'
                        : tile.syllable.length >= 4
                        ? 'text-lg sm:text-xl'
                        : 'text-xl sm:text-2xl'
                    }`}
                  >
                    {isWildcard ? '🌈 *' : tile.syllable}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SÜRÜKLENEN HAYALET TAŞ */}
      {dragState && (
        <div
          style={{
            left: `${dragState.clientX}px`,
            top: `${dragState.clientY - 30}px`
          }}
          className={`pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl ring-2 ring-white/90 scale-110 tile-gloss ${getTileThemeClass(
            dragState.syllable,
            activeTheme,
            dragState.powerType
          )}`}
        >
          {activePreviewSyllable === '*' ? '🌈' : activePreviewSyllable || dragState.syllable}
        </div>
      )}

      {/* 🗺️ BÖLÜM HARİTASI (SEFERBERLİK) MODALI */}
      {showCampaignMapModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-sm h-[78vh] max-h-[580px] rounded-3xl bg-slate-900 border border-slate-700 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-400" />
                  Seferberlik Haritası
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buzları kır, hedefleri tamamla ve yıldızları topla!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCampaignMapModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scroll">
              {Array.from({ length: 25 }, (_, idx) => idx + 1).map((lvlNum) => {
                const cfg = getCampaignLevelConfig(lvlNum);
                const isUnlocked = lvlNum <= campaignProgress.maxUnlockedLevel;
                const isCurrent =
                  gameMode === 'campaign' && campaignProgress.currentLevel === lvlNum;
                const stars = campaignProgress.starsByLevel?.[lvlNum] || 0;

                return (
                  <div
                    key={lvlNum}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : isUnlocked
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-950/30 border-slate-800/50 opacity-55'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{cfg.title}</span>
                        {cfg.isBoss && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black">
                            BOSS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cfg.maxMoves} Hamle • {cfg.iceCoords.length} ❄️ Buz • {cfg.targetWords}{' '}
                        Kelime
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              stars >= s
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700 fill-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => {
                        setShowCampaignMapModal(false);
                        handleRestartGame('campaign', lvlNum);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1 transition ${
                        isUnlocked
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span>{isCurrent ? 'Oyna' : isUnlocked ? 'Başla' : 'Kilitli'}</span>
                      {isUnlocked && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🎉 BÖLÜM ZAFERİ (3 YILDIZLI LEVEL COMPLETE) MODALI */}
      {levelVictoryData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-emerald-400/80 p-6 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-10 h-10 transition-transform ${
                    levelVictoryData.stars >= s
                      ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-lg'
                      : 'text-slate-700 fill-slate-800'
                  }`}
                />
              ))}
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold mb-1">
              <span>BÖLÜM {levelVictoryData.level} TAMAMLANDI!</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">KUSURSUZ ZAFER!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tüm kristal buzları kırdın ve bölüm hedefini tamamladın!
            </p>

            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">BÖLÜM SKORU</div>
                <div className="text-xl font-black text-amber-400 mt-0.5 tabular-nums">
                  {levelVictoryData.score}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">KAZANILAN ÖDÜL</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
                  +{levelVictoryData.rewardCoins} 🪙
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRestartGame('campaign', levelVictoryData.level + 1)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
            >
              <span>BÖLÜM {levelVictoryData.level + 1}&apos;E GEÇ</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* KOZMETİK TEMA & TAŞ MAĞAZASI MODALI */}
      {showThemeShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-fuchsia-400" />
                  Tema & Taş Mağazası
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mevcut Altının: <strong className="text-amber-400">{coins} 🪙</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeShopModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 my-4">
              {COSMETIC_THEMES.map((theme) => {
                const isOwned = unlockedThemes.includes(theme.id);
                const isSelected = activeTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-fuchsia-950/30 border-fuchsia-400'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs tile-gloss shrink-0 ${theme.classes[0]}`}
                      >
                        KA
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{theme.name}</div>
                        <div className="text-[10px] text-slate-400">{theme.desc}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrSelectTheme(theme)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : isOwned
                          ? 'bg-slate-800 hover:bg-slate-700 text-white'
                          : coins >= theme.price
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? 'Aktif' : isOwned ? 'Seç' : `${theme.price} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowThemeShopModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs"
            >
              OYUNA DÖN
            </button>
          </div>
        </div>
      )}

      {/* SÖZLÜK, KOLEKSİYON & CANLI KELİME EKLEME MODALI */}
      {showDictionaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-md h-[84vh] max-h-[640px] rounded-3xl bg-slate-900 border border-slate-700/90 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  TDK Tam Sözlük ({TOTAL_TDK_WORD_COUNT.toLocaleString('tr-TR')}+ Kelime)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  2, 3, 4 ve 5 heceli tüm TDK kelimeleri aktif • Keşfettiğin:{' '}
                  <strong className="text-emerald-400">{discoveredWords.length}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleAddCustomWord}
              className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80"
            >
              <div className="text-[10px] font-extrabold text-amber-400 uppercase mb-1">
                + Sözlüğe Yeni Türkçe Kelime Ekle (Anında Tahtada Patlar!)
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  placeholder="2..5 heceli kelime yaz (Örn: DOLAR, CUMHURİYET)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0"
                >
                  Ekle
                </button>
              </div>
              {customWordFeedback && (
                <div
                  className={`text-[11px] font-bold mt-1 ${
                    customWordFeedback.ok ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {customWordFeedback.text}
                </div>
              )}
            </form>

            <div className="px-4 pt-2.5 pb-2 border-b border-slate-800/80 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                  placeholder="59.855 TDK kelimesinde ara (Örn: DO, LAR, BİLGİSAYAR)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: `TDK (${TOTAL_TDK_WORD_COUNT.toLocaleString('tr-TR')})` },
                  { id: 'discovered', label: `Keşfedilen (${discoveredWords.length})` },
                  { id: '2', label: '2 Heceli' },
                  { id: '3', label: '3 Heceli' },
                  { id: '4+', label: '4-5 Heceli' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDictFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      dictFilter === tab.id
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scroll">
              {filteredDictionary.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aramana uygun kelime bulunamadı. Yukarıdan hemen ekleyebilirsin!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredDictionary.map((item) => {
                    const isFound = discoveredWords.includes(item.word);
                    return (
                      <div
                        key={item.key}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          isFound
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.syllables.map((s, idx) => (
                            <span
                              key={`${item.key}-${idx}`}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-black ${
                                isFound
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        {isFound && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BAŞARIMLAR & OYUNCU KARİYER İSTATİSTİKLERİ MODALI */}
      {showAchievementsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-sm h-[82vh] max-h-[600px] rounded-3xl bg-slate-900 border border-slate-700 p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Kariyer & Başarımlar
              </h3>
              <button
                type="button"
                onClick={() => setShowAchievementsModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kariyer İstatistik Özeti */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">TOPLAM KELİME</div>
                <div className="text-sm font-black text-sky-400 mt-0.5">
                  {lifetimeStats.totalWords}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">KIRILAN BUZ</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {lifetimeStats.iceBroken} ❄️
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">EN UZUN KELİME</div>
                <div className="text-xs font-black text-amber-400 mt-0.5 truncate">
                  {lifetimeStats.longestWord || '-'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              {ACHIEVEMENT_LIST.map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isUnlocked
                        ? 'bg-amber-500/15 border-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{ach.title}</span>
                        {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ach.desc}</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-300 font-black text-xs shrink-0">
                      +{ach.reward} 🪙
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleShareScore}
                className="py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Skoru Paylaş</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAchievementsModal(false)}
                className="py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
              >
                KAPAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OYUN SONU (GAME OVER) & "SON ŞANS DİRİLİŞ" PENCERESİ */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-popIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-slate-700/80 p-6 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Rütbe: {currentRank.title}</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {gameMode === 'blitz' && timeLeft <= 0
                ? 'SÜRE DOLDU!'
                : gameMode === 'campaign' && movesLeft <= 0
                ? 'HAMLE BİTTİ!'
                : 'TAHTA DOLDU!'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Skorunu kaybetmeden devam etmek ister misin?</p>

            <div className="grid grid-cols-2 gap-2 my-3.5">
              <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">TOPLAM SKOR</div>
                <div className="text-xl font-black text-amber-400 mt-0.5 tabular-nums">{score}</div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">EN YÜKSEK REKOR</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
                  {gameMode === 'blitz' ? blitzHighScore : highScore}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">KURULAN KELİME</div>
                <div className="text-xl font-black text-sky-400 mt-0.5 tabular-nums">
                  {wordsFoundCount}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">EN YÜKSEK KOMBO</div>
                <div className="text-xl font-black text-rose-400 mt-0.5 tabular-nums">
                  x{maxComboReached}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSecondChanceRevive}
              disabled={coins < 100}
              className={`w-full py-3 px-4 mb-2 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                coins >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/25 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <HeartHandshake className="w-5 h-5 shrink-0" />
              <span>SON ŞANS: ORTADAKİ 9 TAŞI PATLAT (100 🪙)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleShareScore}
                className="py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>PAYLAŞ</span>
              </button>
              <button
                type="button"
                onClick={() => handleRestartGame(gameMode)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>YENİ OYUN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NASIL OYNANIR BİLGİ PENCERESİ */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Hece Zinciri PRO Rehberi
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 my-4 leading-relaxed">
              <li>
                <strong className="text-emerald-400">1. 🗺️ Bölüm Modu & ❄️ Kristal Buzlar:</strong>{' '}
                Tahtadaki mavi buzlu hücrelerin üzerinde veya hemen komşusunda kelime patlatarak
                buzları kır (+100P & +25🪙) ve 3 yıldızla bölümleri geç!
              </li>
              <li>
                <strong className="text-amber-400">2. Özel Güç Taşları:</strong>{' '}
                <strong>🌈 Joker (*)</strong> konulduğu yerde en iyi kelimeyi tamamlayan heceye
                dönüşür. <strong>💣 Bomba</strong> patladığında 3x3 çevresini uçurur.{' '}
                <strong>💎 2x Elmas</strong> puanı ve altını ikiye katlar!
              </li>
              <li>
                <strong className="text-rose-400">3. ↩️ Geri Al & 🎵 Zen Müziği:</strong> Yanlış
                yere koyduğun taşı <strong>Geri</strong> butonuyla geri alabilir, üstteki{' '}
                <strong>🎵 Müzik</strong> ikonuyla rahatlatıcı Zen ambiyans müziğini açabilirsin.
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
            >
              ANLADIM, OYUNA DÖN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameErrorBoundary>
      <HeceZinciriGame />
    </GameErrorBoundary>
  );
}
