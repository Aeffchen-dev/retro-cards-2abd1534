import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import StackIcon from "@/components/StackIcon";
import ActionRow from "@/components/ActionRow";
import PostItField from "@/components/PostItField";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { saveToStorage, loadFromStorage, clearExpiredStorage, STORAGE_KEYS } from '@/lib/storage';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Memoji images from public assets folder (fallbacks if user didn't pick emojis)
const niklasMemoji = "/assets/niklas-memoji.png";
const janaMemoji = "/assets/jana-memoji.png";

// Slide IDs — case numbers used inside renderCard's switch
// Legacy cases 0-10 (with 6=Kalle removed), plus new: 100=Intro, 101=Setup, 102=Reflection, 103=Logo
const SLIDE_INTRO = 100;
const SLIDE_SETUP = 101;
const SLIDE_REFLECTION = 102;
const SLIDE_LOGO = 103;

// Pill label displayed ABOVE the card for each slide (null = no pill)
const SLIDE_PILLS: Record<number, string | null> = {
  103: "Relationship by design",
  100: "Intro",
  101: "Setup",
  0: "Memory Time",
  1: "Health Check",
  2: "Health Check",
  3: "The last 4 weeks",
  102: "Feedback",
  4: "To talk about",
  5: "Nicht monogam",
  7: "Intimacy",
  8: "Takeaways",
  9: "Archive",
  10: "Questions",
};


interface ExtraPartner {
  name: string;
  emoji: string;
}

interface SetupData {
  name1: string;
  name2: string;
  emoji1: string;
  emoji2: string;
  openRelationship: boolean;
  extraPartners: ExtraPartner[];
}

const REFLECTION_FIELDS = [
  ["nice", "Das fand ich schön", "Deine Antwort"],
  ["thanks", "Dafür möchte ich Danke sagen", "Deine Antwort"],
  ["idea", "Das wünsche ich mir", "Deine Antwort"],
] as const;

const NAME1_PLACEHOLDER = "Dein Name";
const NAME2_PLACEHOLDER = "Name deines Partners";
const EMOJI1_PLACEHOLDER = "🧚‍♂️";
const EMOJI2_PLACEHOLDER = "🧚‍♀️";

// German possessive helper: add "s" unless name ends in s, x, z or ß
const germanPossessive = (name: string): string => {
  if (!name) return "";
  const lastChar = name.slice(-1).toLowerCase();
  const needsApostrophe = ["s", "x", "z", "ß"].includes(lastChar);
  return name + (needsApostrophe ? "'" : "s");
};

// Post-it / takeaway placeholder that falls back to sensible German when no name is entered
const postItPlaceholder = (name: string, label: string, fallback: string): string => {
  if (!name || name === NAME1_PLACEHOLDER || name === NAME2_PLACEHOLDER) return fallback;
  return `${germanPossessive(name)} ${label}`;
};

// Keep only a single emoji grapheme; drop any plain text
const sanitizeEmoji = (input: string): string => {
  if (!input) return "";
  const emojiRe = /\p{Extended_Pictographic}/u;
  try {
    // @ts-ignore
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    // @ts-ignore
    const graphemes = Array.from(seg.segment(input), (s: any) => s.segment as string);
    for (let i = graphemes.length - 1; i >= 0; i--) {
      if (emojiRe.test(graphemes[i])) return graphemes[i];
    }
    return "";
  } catch {
    const m = input.match(/\p{Extended_Pictographic}(\u200D\p{Extended_Pictographic})*/gu);
    return m ? m[m.length - 1] : "";
  }
};

interface ReflectionTexts {
  nice: string;
  thanks: string;
  idea: string;
}

interface MemojisPosition {
  [personKey: string]: { x: number; y: number };
}

// Tonal card families — bg + text stay in the same hue family (like the
// Stack Overflow brand palette only (stackoverflow.design/brand/color).
// Cards: Pure White bg + Off-Black text. Accents cycle through the brand
// primaries, each paired with its dark counterpart for the pill dot.
// One colour per "last 4 weeks" question — drives the page background in edit mode
const QUESTION_COLORS = ["#1E5F3A", "#2F7D4F", "#45A164", "#5EBA7D", "#8FD3A3", "#C6E6C1"];

// Stack Overflow brand palette (stackoverflow.design/brand/color)
const BRAND = {
  stackOrange: "#FF5E00",
  purple: "#9D9CFF",
  pink: "#F39FFF",
  yellow: "#FFCC00",
  blue: "#5074EF",
  green: "#86AF25",
  offBlack: "#201C1D",
  offWhite: "#F0EFEE",
  lightBlue: "#C6D1E1",
  lightBrown: "#998B7A",
  darkOrange: "#31070F",
  mediumOrange: "#6E1527",
  darkPurple: "#390A91",
  darkPink: "#4D1955",
  darkGreen: "#263603",
  darkYellow: "#423101",
  darkBlue: "#00165E",
  white: "#FFFFFF",
} as const;

// Approved label color combinations (icon color on square color) from the
// "Label color guidance" section of the brand docs. Order = rotation order.
const LABEL_COMBOS: { icon: string; square: string }[] = [
  { icon: BRAND.offBlack, square: BRAND.stackOrange },
  { icon: BRAND.purple, square: BRAND.darkPurple },
  { icon: BRAND.blue, square: BRAND.lightBlue },
  { icon: BRAND.lightBrown, square: BRAND.darkYellow },
  { icon: BRAND.stackOrange, square: BRAND.mediumOrange },
  { icon: BRAND.lightBlue, square: BRAND.stackOrange },
  { icon: BRAND.green, square: BRAND.darkGreen },
  { icon: BRAND.pink, square: BRAND.darkPink },
];

// Card backgrounds stay neutral (brand background colors); the accent/pill of
// each slide is driven by the approved label combination for that index.
const CARD_BACKGROUNDS = [
  BRAND.pink,
  BRAND.white,
  BRAND.white,
  BRAND.white,
  BRAND.white,
  BRAND.white,
  BRAND.white,
  BRAND.white,
];

const CARD_THEMES: { bg: string; text: string; accent: string; pill: string; pillDot: string }[] =
  CARD_BACKGROUNDS.map((bg, i) => {
    const combo = LABEL_COMBOS[i % LABEL_COMBOS.length];
    return {
      bg,
      text: BRAND.offBlack,
      accent: combo.square,
      pill: combo.square,
      pillDot: combo.icon,
    };
  });



const RetroCards: React.FC = () => {
  // Initialize currentCard from localStorage synchronously for initialSlide
  const [currentCard, setCurrentCard] = useState(() => {
    const saved = loadFromStorage<number>(STORAGE_KEYS.CURRENT_CARD);
    return saved !== null ? saved : 0;
  });
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  

  // State for draggable memojis on health check cards - use lazy initialization
  const [memojisPositions, setMemojisPositions] = useState<
    Record<number, MemojisPosition>
  >(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const x = mobile ? 248 : 380;
    const y0 = mobile ? 64 : 120;
    const y1 = mobile ? 136 : 192;
    return {
      1: { p0: { x, y: y0 }, p1: { x, y: y1 } },
      2: { p0: { x, y: y0 }, p1: { x, y: y1 } },
    };
  });

  // State for memoji dragging
  const [draggingMemoji, setDraggingMemoji] = useState<{
    cardIndex: number;
    person: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // State for viewport height - use lazy initialization
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 767
  );

  // State for mobile detection - use lazy initialization
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.innerWidth <= 768
  );

  // State for editable post-it notes — keyed by person key (p0, p1, p2...)
  const [postItTexts, setPostItTexts] = useState<Record<string, string>>({});

  // State for takeaway post-it notes (Erkenntnisse) — keyed by person key
  const [takeawayTexts, setTakeawayTexts] = useState<Record<string, string>>({});

  // State for random questions
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [allQuestions, setAllQuestions] = useState<string[]>([]);

  // State for camera modal
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for captured photos
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  // State for setup (names, emojis, open-relationship toggle, extra partners)
  const [setupData, setSetupData] = useState<SetupData>(() => {
    const saved = loadFromStorage<Partial<SetupData>>(STORAGE_KEYS.SETUP_DATA);
    return {
      name1: '',
      name2: '',
      emoji1: '',
      emoji2: '',
      openRelationship: false,
      extraPartners: [],
      ...(saved || {}),
    } as SetupData;
  });

  // Display fallbacks for name/emoji
  const displayName1 = setupData.name1 || NAME1_PLACEHOLDER;
  const displayName2 = setupData.name2 || NAME2_PLACEHOLDER;
  const displayEmoji1 = setupData.emoji1 || EMOJI1_PLACEHOLDER;
  const displayEmoji2 = setupData.emoji2 || EMOJI2_PLACEHOLDER;

  // All persons (2 main + extra partners) — used to render draggable memojis on health-check slides
  const persons = useMemo(() => {
    return [
      { key: 'p0', name: displayName1, emoji: displayEmoji1 },
      { key: 'p1', name: displayName2, emoji: displayEmoji2 },
      ...setupData.extraPartners.map((p, i) => ({
        key: `p${i + 2}`,
        name: p.name || `Partner ${i + 3}`,
        emoji: p.emoji || '🧚',
      })),
    ];
  }, [displayName1, displayName2, displayEmoji1, displayEmoji2, setupData.extraPartners]);

  // State for reflection slide post-its
  const [reflectionTexts, setReflectionTexts] = useState<ReflectionTexts>(() => {
    const saved = loadFromStorage<ReflectionTexts>(STORAGE_KEYS.REFLECTION_TEXTS);
    return saved || { nice: '', thanks: '', idea: '' };
  });

  // State for edit mode on slides — keyed by slide id (case number)
  const [editModeSlides, setEditModeSlides] = useState<Record<number, boolean>>({});
  // Which question row of a slide is being edited (slide 3 rows)
  const [activeQuestion, setActiveQuestion] = useState<Record<number, { idx: number; label: string } | null>>({});
  // Edit-mode notes keyed by slideId -> { [personKey]: text } (migrates from legacy {note1, note2})
  const [editModeNotes, setEditModeNotes] = useState<Record<number, Record<string, string>>>(() => {
    const saved = loadFromStorage<Record<number, any>>(STORAGE_KEYS.EDIT_MODE_NOTES);
    if (!saved) return {};
    const migrated: Record<number, Record<string, string>> = {};
    for (const k of Object.keys(saved)) {
      const v = saved[k as any] || {};
      if ('note1' in v || 'note2' in v) {
        migrated[k as any] = { p0: v.note1 || '', p1: v.note2 || '' };
      } else {
        migrated[k as any] = v;
      }
    }
    return migrated;
  });

  // Placeholder helper for per-person post-its
  const personPlaceholder = useCallback(
    (person: { name: string }, idx: number, label: string, fallbackMine: string, fallbackPartner: string): string => {
      if (idx === 0) return postItPlaceholder(setupData.name1, label, fallbackMine);
      if (idx === 1) return postItPlaceholder(setupData.name2, label, fallbackPartner);
      const name = person.name || `Partner ${idx + 1}`;
      return `${germanPossessive(name)} ${label}`;
    },
    [setupData.name1, setupData.name2]
  );

  // Slide ids with edit button: health-personal(1), health-relationship(2), last-4-weeks(3),
  // reflection(102), dates(5), intimacy(7)
  const slidesWithEditButton = [1, 2, 3, 5, 7];

  // Ordered list of visible slide ids — filters out dates if openRelationship is off
  const slides = useMemo(() => {
    const arr: number[] = [SLIDE_LOGO, SLIDE_INTRO, SLIDE_SETUP, 0, 1, 2, 3, SLIDE_REFLECTION, 4];
    if (setupData.openRelationship) arr.push(5);
    arr.push(7, 8, 9, 10);
    return arr;
  }, [setupData.openRelationship]);

  const totalCards = slides.length;

  // The pill/label colour of a slide is derived from its POSITION in the slides
  // array (same as the rendered pill), not from its slide id.
  const pillColorOf = useCallback(
    (slideId: number) => {
      // Memory Time slide is always purple
      if (slideId === 0) return BRAND.purple;
      // Health check slides: swapped orange combo
      if (slideId === 1 || slideId === 2) return BRAND.stackOrange;
      // Last 4 weeks: swapped green combo
      if (slideId === 3) return BRAND.green;
      // Feedback: pink
      if (slideId === SLIDE_REFLECTION) return BRAND.pink;
      // Takeaways: swapped blue combo
      if (slideId === 8) return BRAND.blue;
      // Intimacy: dark purple square with white icon
      if (slideId === 7) return BRAND.darkPurple;
      const idx = slides.indexOf(slideId);
      return CARD_THEMES[(idx < 0 ? 0 : idx) % CARD_THEMES.length].pill;
    },
    [slides]
  );

  // Track if initial load is complete to avoid saving on mount
  const isInitialMount = useRef(true);

  // Load persisted state on mount - single batch to reduce re-renders
  useEffect(() => {
    // Defer cleanup to not block initial render
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => clearExpiredStorage());
    } else {
      setTimeout(clearExpiredStorage, 500);
    }
    
    // Load all saved state at once
    const savedCurrentCard = loadFromStorage<number>(STORAGE_KEYS.CURRENT_CARD);
    const savedMemojiPositions = loadFromStorage<Record<number, MemojisPosition>>(STORAGE_KEYS.MEMOJI_POSITIONS);
    const savedPostItTexts = loadFromStorage<any>(STORAGE_KEYS.POST_IT_TEXTS);
    const savedTakeawayTexts = loadFromStorage<any>(STORAGE_KEYS.TAKEAWAY_TEXTS);
    const savedQuestion = loadFromStorage<string>(STORAGE_KEYS.CURRENT_QUESTION);

    // Migrate legacy {niklas, jana} shape to keyed record
    const migratePostIts = (v: any): Record<string, string> => {
      if (!v) return {};
      if ('niklas' in v || 'jana' in v) return { p0: v.niklas || '', p1: v.jana || '' };
      return v;
    };

    // Batch state updates using unstable_batchedUpdates pattern
    // React 18 auto-batches, but we minimize by setting all at once
    if (savedCurrentCard !== null) setCurrentCard(savedCurrentCard);
    if (savedMemojiPositions !== null) setMemojisPositions(savedMemojiPositions);
    if (savedPostItTexts !== null) setPostItTexts(migratePostIts(savedPostItTexts));
    if (savedTakeawayTexts !== null) setTakeawayTexts(migratePostIts(savedTakeawayTexts));
    if (savedQuestion !== null) setCurrentQuestion(savedQuestion);
    
    // Mark initial mount complete after a tick
    requestAnimationFrame(() => {
      isInitialMount.current = false;
    });
  }, []);

  // Save state when it changes - skip initial mount
  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.CURRENT_CARD, currentCard);
  }, [currentCard]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.MEMOJI_POSITIONS, memojisPositions);
  }, [memojisPositions]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.POST_IT_TEXTS, postItTexts);
  }, [postItTexts]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.TAKEAWAY_TEXTS, takeawayTexts);
  }, [takeawayTexts]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (currentQuestion) {
      saveToStorage(STORAGE_KEYS.CURRENT_QUESTION, currentQuestion);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.EDIT_MODE_NOTES, editModeNotes);
  }, [editModeNotes]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.SETUP_DATA, setupData);
    try {
      const value = encodeURIComponent(JSON.stringify(setupData));
      // 1 year cookie
      document.cookie = `${STORAGE_KEYS.SETUP_DATA}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }, [setupData]);

  useEffect(() => {
    if (isInitialMount.current) return;
    saveToStorage(STORAGE_KEYS.REFLECTION_TEXTS, reflectionTexts);
  }, [reflectionTexts]);

  // Toggle edit mode for a slide
  const toggleEditMode = useCallback((slideIndex: number) => {
    setEditModeSlides(prev => ({
      ...prev,
      [slideIndex]: !prev[slideIndex]
    }));
    setActiveQuestion(prev => ({ ...prev, [slideIndex]: null }));
  }, []);

  // Open edit mode for one specific question row of a slide
  const openQuestionEdit = useCallback((slideIndex: number, qIdx: number, label: string) => {
    setActiveQuestion(prev => ({ ...prev, [slideIndex]: { idx: qIdx, label } }));
    setEditModeSlides(prev => ({ ...prev, [slideIndex]: true }));
  }, []);

  // Page background: near-black tint of the current slide's label colour, morphing on transition
  useEffect(() => {
    const theme = CARD_THEMES[currentCard % CARD_THEMES.length];
    const source = theme?.pill;
    if (source) {
      const h = source.replace("#", "");
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      // mix 12% of the label colour into near-black
      const mix = (c: number) => Math.round(c * 0.12 + 9 * 0.88);
      document.body.style.transition = "background-color 600ms cubic-bezier(0.2, 0, 0, 1)";
      document.body.style.backgroundColor = `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [currentCard, activeQuestion]);

  // Handle slide change - memoized to prevent unnecessary re-renders
  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentCard(swiper.activeIndex);
    // Only reset if there are active edit modes
    setEditModeSlides(prev => Object.keys(prev).length > 0 ? {} : prev);
  }, [slides]);

  // Get question text for a slide (for edit mode display)
  const getSlideQuestion = useCallback((slideId: number): string => {
    const questions: Record<number, string> = {
      1: isMobile ? "Wie geht's mir persönlich?" : "Wie geht's mir persönlich in letzter Zeit?",
      2: "Wie geht's mir in der Beziehung?",
      3: "Wie waren die letzten 4 Wochen? Was war los?",
      [SLIDE_REFLECTION]: "Feedback",
      5: "Wie stehts mit Dates?",
      7: "Sind wir uns körperlich nah?",
    };
    return questions[slideId] || "";
  }, [isMobile]);

  // Fetch questions from Google Sheets - truly non-blocking with cache
  useEffect(() => {
    const QUESTIONS_CACHE_KEY = 'retro-cards-questions-cache-v4';
    let hasCachedData = false;
    
    // Try to load cached questions immediately for fast initial render
    try {
      const cached = localStorage.getItem(QUESTIONS_CACHE_KEY);
      if (cached) {
        const { questions: cachedQuestions, timestamp } = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp < oneHour && cachedQuestions.length > 0) {
          setAllQuestions(cachedQuestions);
          setQuestionsLoaded(true);
          hasCachedData = true;
          
          // Set random question if none saved
          const savedQuestion = loadFromStorage<string>(STORAGE_KEYS.CURRENT_QUESTION);
          if (!savedQuestion) {
            const randomIndex = Math.floor(Math.random() * cachedQuestions.length);
            setCurrentQuestion(cachedQuestions[randomIndex]);
          }
          // If we have valid cache, don't fetch at all during initial load
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached questions');
    }
    
    // Only fetch if no valid cache - delay significantly to not block initial interaction
    const fetchQuestions = async () => {
      const sheetIds = [
        '1-BHUX8Zm4C2tACRJugpF_fj8TzBXnGGGUYQV3ggfKYM',
        '1ROCLsLu2rSJKRwkX5DkZHLHKzy_bksmHbgGqORG2DOk'
      ];
      
      const questions: string[] = [];
      const checkInRouletteId = '1ROCLsLu2rSJKRwkX5DkZHLHKzy_bksmHbgGqORG2DOk';
      
      // Fetch sheets sequentially to avoid network congestion blocking main thread
      for (const sheetId of sheetIds) {
        try {
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
          const response = await fetch(url);
          const text = await response.text();
          
          // Yield to main thread before parsing
          await new Promise(resolve => setTimeout(resolve, 0));
          
          // Parse CSV - split by newlines and get second column (question)
          let rows = text.split('\n').filter(row => row.trim());
          
          // Skip first row (header) for both sheets
          if (rows.length > 0) {
            rows = rows.slice(1);
          }
          
          rows.forEach(row => {
            // Parse CSV columns - handle quoted values
            const columns = row.match(/("([^"]*("")*)*"|[^,]*)(,|$)/g);
            if (columns && columns.length >= 2) {
              // Get first column (category) and check if it's "intro"
              const firstCol = columns[0]?.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim().toLowerCase();
              
              // Skip intro category questions
              if (firstCol === 'intro') {
                return;
              }
              
              // Get second column (index 1), remove trailing comma and quotes
              const secondCol = columns[1]?.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
              
              // Skip one-word questions
              const wordCount = secondCol?.split(/\s+/).filter(word => word.length > 0).length || 0;
              if (secondCol && secondCol.length > 0 && wordCount > 1) {
                questions.push(secondCol);
              }
            }
          });
        } catch (error) {
          console.warn('Failed to fetch questions from sheet:', sheetId, error);
        }
      }
      
      if (questions.length > 0) {
        // Cache the questions
        try {
          localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify({
            questions,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache questions');
        }
        
        setAllQuestions(questions);
        setQuestionsLoaded(true);
        
        // If no saved question and no current question, pick a random one
        const savedQuestion = loadFromStorage<string>(STORAGE_KEYS.CURRENT_QUESTION);
        if (!savedQuestion && questions.length > 0) {
          const randomIndex = Math.floor(Math.random() * questions.length);
          setCurrentQuestion(questions[randomIndex]);
        }
      }
    };
    
    // Wait 2 seconds after page load before fetching to ensure UI is interactive
    const timeoutId = setTimeout(fetchQuestions, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  const getRandomQuestion = useCallback(() => {
    if (allQuestions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    setCurrentQuestion(allQuestions[randomIndex]);
  }, [allQuestions]);

  // Handle mobile Safari viewport height and card dimensions - debounced
  // Store initial height to avoid resizing when keyboard opens
  const initialViewportHeight = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 767);
  const lastMobileState = useRef<boolean>(typeof window !== "undefined" && window.innerWidth <= 768);
  const lastViewportHeight = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 767);
  
  useEffect(() => {
    let rafId: number | null = null;
    let isCleanedUp = false;
    
    const updateViewportHeight = () => {
      if (isCleanedUp) return;
      
      const height = window.innerHeight;
      const width = window.innerWidth;

      // Only update mobile state if it actually changed
      const newIsMobile = width <= 768;
      if (newIsMobile !== lastMobileState.current) {
        lastMobileState.current = newIsMobile;
        setIsMobile(newIsMobile);
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // On iOS, don't adjust height when keyboard is open (height significantly reduced)
      if (isIOS && window.visualViewport) {
        const keyboardLikelyOpen = window.visualViewport.height < initialViewportHeight.current * 0.75;
        if (keyboardLikelyOpen) {
          // Keyboard is open - don't adjust anything
          return;
        }
        // Keyboard closed - update the initial height reference
        initialViewportHeight.current = height;
      }

      // Only update viewport height if it actually changed significantly (more than 10px)
      const newHeight = Math.max(height, 600);
      if (Math.abs(newHeight - lastViewportHeight.current) > 10) {
        lastViewportHeight.current = newHeight;
        setViewportHeight(newHeight);
      }
    };

    // Run immediately
    updateViewportHeight();
    
    // Debounced handler for events
    const handleResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateViewportHeight);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Single delayed call for iOS Safari initial calculation
    const timeoutId = setTimeout(updateViewportHeight, 100);

    return () => {
      isCleanedUp = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  // Use refs to avoid stale closures in drag handlers
  const isMobileRef = useRef(isMobile);
  const swiperRefRef = useRef(swiperRef);
  
  // Keep refs in sync
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);
  
  useEffect(() => {
    swiperRefRef.current = swiperRef;
  }, [swiperRef]);

  // Add global event listeners for memoji dragging
  useEffect(() => {
    if (!draggingMemoji) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - draggingMemoji.startX;
      const deltaY = e.clientY - draggingMemoji.startY;

      // Use ref for current isMobile value
      const mobile = isMobileRef.current;
      const containerWidth = mobile ? 320 : 480;
      const containerHeight = mobile ? 300 : 520;
      
      const newX = Math.max(0, Math.min(containerWidth - 56, draggingMemoji.initialX + deltaX));
      const newY = Math.max(-40, Math.min(containerHeight - 56, draggingMemoji.initialY + deltaY));

      setMemojisPositions((prev) => ({
        ...prev,
        [draggingMemoji.cardIndex]: {
          ...prev[draggingMemoji.cardIndex],
          [draggingMemoji.person]: { x: newX, y: newY },
        },
      }));
    };

    const handleGlobalMouseUp = () => {
      // Use ref for current swiper value
      if (swiperRefRef.current) {
        swiperRefRef.current.allowTouchMove = true;
      }
      setDraggingMemoji(null);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - draggingMemoji.startX;
      const deltaY = touch.clientY - draggingMemoji.startY;

      // Use ref for current isMobile value
      const mobile = isMobileRef.current;
      const containerWidth = mobile ? 320 : 480;
      const containerHeight = mobile ? 300 : 520;
      
      const newX = Math.max(0, Math.min(containerWidth - 56, draggingMemoji.initialX + deltaX));
      const newY = Math.max(-40, Math.min(containerHeight - 56, draggingMemoji.initialY + deltaY));

      setMemojisPositions((prev) => ({
        ...prev,
        [draggingMemoji.cardIndex]: {
          ...prev[draggingMemoji.cardIndex],
          [draggingMemoji.person]: { x: newX, y: newY },
        },
      }));
    };

    const handleGlobalTouchEnd = () => {
      // Use ref for current swiper value
      if (swiperRefRef.current) {
        swiperRefRef.current.allowTouchMove = true;
      }
      setDraggingMemoji(null);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchmove", handleGlobalTouchMove);
    document.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [draggingMemoji]);

  const openCamera = async () => {
    console.log('Camera button clicked');
    console.log('User agent:', navigator.userAgent);
    console.log('Is secure context:', window.isSecureContext);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMac = /Mac|Macintosh/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !isChrome;
    
    console.log('Is iOS:', isIOS);
    console.log('Is Mac:', isMac);
    console.log('Is Chrome:', isChrome);
    console.log('Is Safari:', isSafari);
    
    // For iPhone, try the file input method first (most reliable)
    if (isIOS) {
      console.log('iPhone detected, using file input method');
      openCameraForIOS();
      return;
    }
    
    // For Mac Safari (not Chrome), use file input method as well (more reliable)
    if (isMac && isSafari && !isChrome) {
      console.log('Mac Safari detected, using file input method');
      openCameraForIOS();
      return;
    }
    
    // Check if we're on HTTPS or localhost (required for camera access)
    const isSecureContext = window.isSecureContext || 
                           window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      console.log('Not a secure context, camera access denied');
      alert(
        "📸 Kamera-Zugriff nicht möglich\n\n" +
        "Kamera-Zugriff ist nur über HTTPS verfügbar.\n" +
        "Aktueller Protokoll: " + window.location.protocol
      );
      return;
    }

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('MediaDevices API not available');
      openCameraForIOS(); // Fallback
      return;
    }

    try {
      console.log('Requesting camera permissions via getUserMedia...');
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted successfully');

      // Create camera preview modal
      openCameraPreview(stream);

    } catch (err) {
      console.error("Error accessing camera via getUserMedia:", err);
      console.log('Falling back to file input method...');
      openCameraForIOS(); // Fallback for any error
    }
  };

  const openCameraForIOS = () => {
    console.log('Opening camera using file input method (iOS compatible)');
    
    try {
      // Create a hidden file input that opens camera on mobile devices
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user'; // Use front camera (selfie camera) by default
      input.style.position = 'fixed';
      input.style.top = '-1000px';
      input.style.left = '-1000px';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      
      console.log('File input created with attributes:', {
        type: input.type,
        accept: input.accept,
        capture: input.capture
      });
      
      input.onchange = (e) => {
        console.log('File input change event triggered');
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          console.log('File selected:', target.files[0]);
          // Convert file to data URL and save
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setCapturedPhotos(prev => [...prev, event.target!.result as string]);
              console.log('Photo saved to state');
            }
          };
          reader.readAsDataURL(target.files[0]);
        } else {
          console.log('No file selected or user cancelled');
        }
        
        // Clean up
        if (document.body.contains(input)) {
          document.body.removeChild(input);
          console.log('File input removed from DOM');
        }
      };
      
      input.oncancel = () => {
        console.log('File input cancelled by user');
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };
      
      // Add to DOM and trigger click
      document.body.appendChild(input);
      console.log('File input added to DOM, triggering click...');
      
      // Small delay to ensure DOM insertion
      setTimeout(() => {
        input.click();
        console.log('File input click triggered');
      }, 100);
      
    } catch (error) {
      console.error('Error in openCameraForIOS:', error);
      alert(
        "📸 Kamera-Zugriff nicht möglich\n\n" +
        "Es gab einen Fehler beim Öffnen der Kamera. " +
        "Fehler: " + error.message + "\n\n" +
        "Versuchen Sie es erneut oder prüfen Sie Ihre Browser-Einstellungen."
      );
    }
  };

  const openCameraPreview = (stream: MediaStream) => {
    console.log('Opening camera preview with stream');
    setCameraStream(stream);
    
    // Set up video element when stream is available
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
    }, 100);
  };

  const closeCameraPreview = () => {
    console.log('Closing camera preview');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setCameraStream(null);
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !cameraStream) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert to blob and show success message
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Picture taken, blob size:', blob.size);
        closeCameraPreview();
      }
    }, 'image/jpeg', 0.8);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const openFeedbackEmail = () => {
    const email = "hello@relationshipbydesign.de";
    const subject = "Feedback Retro Cards";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    window.open(mailtoUrl);
  };

  const openRelationshipByDesign = () => {
    window.open("https://relationshipbydesign.de/", "_blank");
  };

  const handleMemojiMouseDown = (
    e: React.MouseEvent,
    cardIndex: number,
    person: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Disable swiper while dragging memoji
    if (swiperRef) {
      swiperRef.allowTouchMove = false;
    }
    
    const currentPos = memojisPositions[cardIndex]?.[person];
    setDraggingMemoji({
      cardIndex,
      person,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentPos?.x || 380,
      initialY: currentPos?.y || 250,
    });
  };

  const handleMemojiTouchStart = (
    e: React.TouchEvent,
    cardIndex: number,
    person: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Disable swiper while dragging memoji
    if (swiperRef) {
      swiperRef.allowTouchMove = false;
    }
    
    const touch = e.touches[0];
    const currentPos = memojisPositions[cardIndex]?.[person];
    setDraggingMemoji({
      cardIndex,
      person,
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: currentPos?.x || 380,
      initialY: currentPos?.y || 250,
    });
  };

  const memorySwipeRef = useRef<{ x: number; y: number } | null>(null);

  const navigateCard = useCallback((direction: "prev" | "next") => {

    if (!swiperRef) return;
    
    if (direction === "prev") {
      swiperRef.slidePrev();
    } else {
      swiperRef.slideNext();
    }
  }, [swiperRef]);

  // Global keyboard navigation (ignored while typing in inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        navigateCard("prev");
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        navigateCard("next");
      } else if (e.key === "Home") {
        e.preventDefault();
        swiperRef?.slideTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        swiperRef?.slideTo(slides.length - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigateCard, swiperRef, slides.length]);


  const clearAllUserData = useCallback(() => {
    if (window.confirm("Möchtest du wirklich alle deine Einträge löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      // Clear all state
      setPostItTexts({});
      setTakeawayTexts({});
      setEditModeNotes({});
      setReflectionTexts({ nice: '', thanks: '', idea: '' });
      setCapturedPhotos([]);
      setCurrentQuestion("");
      
      // Reset memoji positions
      const mobile = window.innerWidth <= 768;
      const x = mobile ? 248 : 380;
      const y0 = mobile ? 64 : 120;
      const y1 = mobile ? 136 : 192;
      setMemojisPositions({
        1: { p0: { x, y: y0 }, p1: { x, y: y1 } },
        2: { p0: { x, y: y0 }, p1: { x, y: y1 } },
      });
      
      // Clear localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also clear questions cache
      localStorage.removeItem('retro-cards-questions-cache-v4');
    }
  }, []);






  const renderCard = (cardIndex: number) => {
    switch (cardIndex) {
      case 0:
        return (
          <div
            className="relative flex flex-col items-start w-full h-full"
            onTouchStart={(e) => {
              const t = e.touches[0];
              memorySwipeRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = memorySwipeRef.current;
              memorySwipeRef.current = null;
              if (!start) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
              navigateCard(dx < 0 ? "next" : "prev");
            }}
          >

            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label" style={{ lineHeight: 1, display: 'flex', alignItems: 'center' }}>Memory Time</span>
              </div>
              <h2 className="retro-heading w-full">
                Schießt ein paar süße Fotos zusammen
              </h2>
            </div>

            {/* Print-only: Show captured photos in a single row */}
            {capturedPhotos.length > 0 && (
              <div className="hidden print-only gap-2 mt-8 w-full flex-row items-center">
                {capturedPhotos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Captured photo ${index + 1}`}
                    className="h-[120px] object-contain rounded-lg flex-shrink"
                    style={{ maxWidth: `${Math.floor(100 / Math.max(capturedPhotos.length, 1)) - 2}%` }}
                  />
                ))}
              </div>
            )}
            <div className="mt-auto pt-7">
              <ActionRow
                icon="IconImage"
                label="Kamera öffnen"
                accent={pillColorOf(0)}
                onClick={() => openCamera()}
              />
            </div>
          </div>

        );

      case 1:
      case 2: {
        const cardId = cardIndex;
        const heading = cardId === 1
          ? (isMobile ? "Wie geht's mir persönlich?" : "Wie geht's mir persönlich in letzter Zeit?")
          : "Wie geht's mir in der Beziehung?";
        const defaultX = isMobile ? 248 : 380;
        // Stagger default y positions per person so they don't overlap
        const defaultY = (i: number) => (isMobile ? 35 + i * 49 : 87 + i * 65);
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Health Check</span>
              </div>
              <h2 className="retro-heading w-full">{heading}</h2>
            </div>
            <div className="relative w-full flex-1 mt-10 mb-12 print-memoji-container">
              <div className="flex flex-col items-start justify-between h-full print-emoji-scale">
                <div className="text-4xl">🤩</div>
                <div className="text-4xl">🙂</div>
                <div className="text-4xl">🤨</div>
                <div className="text-4xl">🙁</div>
                <div className="text-4xl">😩</div>
              </div>
              {/* Draggable Memojis — one per person */}
              {persons.map((person, i) => {
                const posX = memojisPositions[cardId]?.[person.key]?.x ?? defaultX;
                const posY = memojisPositions[cardId]?.[person.key]?.y ?? defaultY(i);
                return (
                  <div
                    key={person.key}
                    className={`absolute w-14 h-14 cursor-move select-none touch-none print-memoji print-memoji-${person.key}`}
                    style={{
                      left: posX,
                      top: posY,
                      zIndex: 1000,
                      '--print-top-percent': `${(posY / (isMobile ? 400 : 520)) * 100}%`,
                      '--print-left-percent': `${(posX / (isMobile ? 320 : 480)) * 100}%`,
                    } as React.CSSProperties}
                    onMouseDown={(e) => handleMemojiMouseDown(e, cardId, person.key)}
                    onTouchStart={(e) => handleMemojiTouchStart(e, cardId, person.key)}
                  >
                    <div className="w-full h-full flex items-center justify-center rounded-full pointer-events-none text-4xl leading-none">
                      {person.emoji}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute screen-only" style={{ left: '28px', bottom: '28px' }}>
              <ActionRow
                icon="IconInfo"
                label="Zieht euer Emoji zur Skala"
                accent="#F1F2F4"
                fieldBg="#F1F2F4"
                iconColor="#201C1D"
                labelColor="#201C1D"
                onClick={() => toggleEditMode(cardId)}
              />
            </div>

          </div>
        );
      }


      case 3:
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">The last 4 weeks</span>
              </div>
              <h2 className="retro-heading w-full">
                Was war die letzten 4 Wochen so los?
              </h2>
            </div>
            <div className="flex flex-col flex-1 justify-end w-full" style={{ gap: '16px' }}>
              {([
                ["IconAchievements", "Das habe(n) ich / wir richtig gerockt"],
                ["IconHeart", "Ein schöner Moment"],
                ["IconLightbulb", "Das habe ich gelernt"],
                ["IconFaceFrown", "Das hat mich Kraft gekostet"],
                ["IconSpeechBubbleQuestion", "Was beschäftigt mich grade?"],
                ["IconSpeechBubble", "Die letzten 4 Wochen in einem Wort"],
              ] as const).map(([iconName, label], i) => (
                <ActionRow
                  key={i}
                  icon={iconName}
                  label={String(label)}
                  accent={pillColorOf(3)}
                  className="question-font"
                  onClick={() => openQuestionEdit(3, i, String(label))}
                />
              ))}

            </div>


          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-start w-full h-full relative">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">
                  {persons.map((p, i) => p.name || `Partner ${i + 1}`).join(" & ")} Themen
                </span>
              </div>
              <h2 className="question-font retro-heading w-full">
                Darüber möchte ich mit dir sprechen
              </h2>
            </div>
            <div className="flex flex-col flex-1 w-full justify-between gap-6 mt-10 screen-only">
              {persons.map((person, idx) => (
                <PostItField
                  key={person.key}
                  accent={pillColorOf(4)}
                  label={personPlaceholder(person, idx, "Themen", "Meine Themen", "Themen meines Partners")}
                  placeholder="z. B. Urlaubsplanung, Aufgaben im Haushalt, Zeit zu zweit …"
                  value={postItTexts[person.key] || ""}
                  onChange={(v) => setPostItTexts({ ...postItTexts, [person.key]: v })}
                />
              ))}
            </div>
            {/* Print-only: post-it notes like takeaways with line breaks */}
            <div className="hidden print-only flex-col flex-1 w-full justify-between gap-6 mt-10">
              {persons.map((person, idx) => (
                <PostItField
                  key={person.key}
                  readOnly
                  minHeight={120}
                  accent={pillColorOf(4)}
                  label={personPlaceholder(person, idx, "Themen", "Meine Themen", "Themen meines Partners")}
                  placeholder="z. B. Urlaubsplanung, Aufgaben im Haushalt, Zeit zu zweit …"
                  value={postItTexts[person.key] || ""}
                />
              ))}
            </div>

          </div>
        );

      case 5:
        return (
          <div className="flex flex-col items-start gap-14 w-full justify-center">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Nicht monogam</span>
              </div>
              <h2 className="retro-heading w-full">Wie stehts mit Dates?</h2>
            </div>
          </div>
        );

      case SLIDE_LOGO:
        return (
          <div className="relative flex flex-col items-center w-full h-full text-center" style={{ paddingTop: '35%' }}>
            <h1
              className="retro-title logo-slide-anim"
              style={{ fontSize: '92px', lineHeight: 0.84, fontWeight: 500, color: '#FF5E00' }}
            >
              Retro Cards
            </h1>
            <p className="retro-body-copy mt-8 text-center" style={{ fontSize: '16px', lineHeight: 1.5, color: '#201C1D' }}>
              Ein interaktiver Check-in
              <br />
              für eine gesunde Beziehung
            </p>
            <div className="absolute left-0 right-0 flex items-center" style={{ bottom: '0px' }}>
              <ActionRow
                icon="IconArrowRight"
                label="Weiter swipen"
                accent="transparent"
                outlined
                onClick={() => swiperRef?.slideNext()}
              />
            </div>



          </div>

        );

      case SLIDE_INTRO:
        return (
          <div className="flex flex-col justify-start items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <h2 className="retro-heading w-full">Stärkt eure Connection</h2>
              <div className="flex flex-col gap-4 w-full retro-body-copy">

                <p>Retro Cards ist euer monatlicher Check-in für eure Beziehung. Nehmt euch Zeit füreinander, sprecht ehrlich über das, was euch bewegt, und stärkt, was euch verbindet.</p>
                <p>Macht daraus euren Date-Abend. Schnappt euch euer Lieblingsgetränk, macht’s euch gemütlich und genießt ein gutes Gespräch.</p>
                <p>Hört einander zu, bleibt neugierig und denkt immer daran: Ihr seid ein Team.</p>
              </div>
            </div>
          </div>
        );

      case SLIDE_SETUP: {
        const SETUP_ACCENT = pillColorOf(SLIDE_SETUP); // tag/label colour of this slide
        const SETUP_ON_ACCENT = "#201C1D"; // dark text/icons on the accent
        const SETUP_TEXT = "#201C1D"; // dark text on white slide bg
        const SETUP_FIELD_BG = "#C6D1E1"; // input fill

        const SETUP_GREY_FILL = "#E4E6E8";
        const nameInputCls = "swiper-no-swiping name-input-field retro-input retro-input-dark-text h-8 w-full rounded-none focus:outline-none focus:ring-2 focus:ring-black/10 px-3 text-base placeholder:text-base placeholder:text-[#201C1D]/50";
        const fieldStyle = { background: SETUP_GREY_FILL, color: SETUP_TEXT, border: "none" } as React.CSSProperties;
        const emojiFieldStyle = { background: SETUP_ACCENT, color: SETUP_ON_ACCENT, border: "none" } as React.CSSProperties;
        const rowCls = "flex items-center gap-0 w-full mb-2";

        const emojiPicker = (
          value: string,
          placeholder: string,
          onChange: (val: string) => void
        ) => (
          <div className="relative shrink-0 w-8 h-8">
            <input
              type="text"
              inputMode="text"
              value={value}
              onChange={(e) => onChange(sanitizeEmoji(e.target.value))}
              onFocus={(e) => e.currentTarget.select()}
              placeholder={placeholder}
              style={emojiFieldStyle}
              className="emoji-picker-input w-full h-full rounded-none text-center text-base retro-input retro-input-dark-text caret-transparent focus:outline-none focus:ring-2 focus:ring-black/10 focus:opacity-10"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center pointer-events-none" style={{ background: SETUP_ON_ACCENT }}>
              <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true" fill="#FFFFFF"><path d="m2.61 1.7.25.07L4.9 3.8l-.05-.01 3.4 3.4a2.25 2.25 0 0 1 3.23 2.03 2.26 2.26 0 1 1-4.3-.97L3.8 4.85l1.9 7.88 4.8.96 3.2-3.2-.96-4.8L7.7 4.48 5.67 2.45l7.88 1.9.46.1.1.48.85 4.28.3-.3 3.32 3.33-4.21 4.2-1.06-1.05 3.15-3.15-1.2-1.2-4.22 4.21 1.2 1.2 1.06 1.06-1.06 1.07-3.32-3.33.29-.29-4.28-.85-.47-.1-.11-.46L1.7 2.6l-.29-1.19zm6.61 6.76a.76.76 0 1 0 0 1.52.76.76 0 0 0 0-1.52"/></svg>

            </div>
          </div>
        );
        return (
          <div className="flex flex-col justify-start items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <h2 className="retro-heading w-full">Wer macht mit?</h2>
            </div>
            <div className="flex flex-col w-full mt-8">

              {/* Person 1 — post-it style field */}
              <div className="flex items-center gap-4 w-full mb-4">
                {emojiPicker(setupData.emoji1, EMOJI1_PLACEHOLDER, (val) => setSetupData({ ...setupData, emoji1: val }))}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="inline-flex self-start items-center h-8 px-3 retro-body-copy" style={{ background: SETUP_ACCENT, color: SETUP_ON_ACCENT }}>
                    {NAME1_PLACEHOLDER}
                  </div>
                  <div className="name-input-wrapper first-name-input-wrapper w-full" style={{ background: SETUP_GREY_FILL }}>
                    <input
                      type="text"
                      value={setupData.name1}
                      onChange={(e) => setSetupData({ ...setupData, name1: e.target.value })}
                      placeholder="Deine Antwort"
                      style={fieldStyle}
                      className={nameInputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Person 2 — post-it style field */}
              <div className="flex items-center gap-4 w-full mb-4">
                {emojiPicker(setupData.emoji2, EMOJI2_PLACEHOLDER, (val) => setSetupData({ ...setupData, emoji2: val }))}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="inline-flex self-start items-center h-8 px-3 retro-body-copy" style={{ background: SETUP_ACCENT, color: SETUP_ON_ACCENT }}>
                    {NAME2_PLACEHOLDER}
                  </div>
                  <div className="name-input-wrapper w-full" style={{ background: SETUP_GREY_FILL }}>
                    <input
                      type="text"
                      value={setupData.name2}
                      onChange={(e) => setSetupData({ ...setupData, name2: e.target.value })}
                      placeholder="Deine Antwort"
                      style={fieldStyle}
                      className={nameInputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Extra partners — post-it style fields */}
              {setupData.extraPartners.map((p, idx) => (
                <div key={idx} className="flex items-center gap-4 w-full mb-4">
                  {emojiPicker(p.emoji, "🧚", (val) => {
                    const next = [...setupData.extraPartners];
                    next[idx] = { ...next[idx], emoji: val };
                    setSetupData({ ...setupData, extraPartners: next });
                  })}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="inline-flex items-center h-8 px-3 retro-body-copy" style={{ background: SETUP_ACCENT, color: SETUP_ON_ACCENT }}>
                        {`Partner ${idx + 3}`}
                      </div>
                      <button
                        type="button"
                        aria-label="Partner entfernen"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = setupData.extraPartners.filter((_, i) => i !== idx);
                          setSetupData({ ...setupData, extraPartners: next });
                        }}
                        className="relative z-40 shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                        style={{ background: SETUP_ACCENT }}
                      >
                        <StackIcon name="IconClearSm" size={10} color={SETUP_ON_ACCENT} />
                      </button>
                    </div>
                    <div className="name-input-wrapper w-full" style={{ background: SETUP_GREY_FILL }}>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...setupData.extraPartners];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setSetupData({ ...setupData, extraPartners: next });
                        }}
                        placeholder="Deine Antwort"
                        style={fieldStyle}
                        className={nameInputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}


              {/* Add partner button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupData({
                    ...setupData,
                    extraPartners: [...setupData.extraPartners, { name: '', emoji: '' }],
                  });
                }}
                className="relative z-40 w-full flex items-center gap-0 h-8 mb-2 retro-body-copy no-underline rounded-none border-none p-0 transition-opacity hover:opacity-90"
              >
                <span className="shrink-0 w-8 h-8 flex items-center justify-center leading-none" style={{ background: SETUP_ACCENT }}>
                  <StackIcon name="IconPlus" size={16} color="#FFFFFF" />
                </span>
                <span className="flex-1 h-8 flex items-center px-3 text-left whitespace-nowrap" style={{ background: SETUP_GREY_FILL, color: SETUP_TEXT }}>
                  Weiteren Partner hinzufügen
                </span>
              </button>

              {/* Nicht monogam — checkbox row (tile left, label field right) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={setupData.openRelationship}
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupData({ ...setupData, openRelationship: !setupData.openRelationship });
                }}
                className="relative z-40 w-full flex items-center gap-0 h-8 retro-body-copy no-underline rounded-none border-none p-0 transition-opacity hover:opacity-90"
              >
                <span
                  className="shrink-0 w-8 h-8 flex items-center justify-center"
                  style={{ background: SETUP_ACCENT }}
                >
                  <span
                    className="w-4 h-4"
                    style={{
                      border: '1px solid #201C1D',
                      background: setupData.openRelationship ? '#201C1D' : 'transparent',
                    }}
                  />
                </span>


                <span className="flex-1 h-8 flex items-center px-3 text-left whitespace-nowrap" style={{ background: SETUP_GREY_FILL, color: SETUP_TEXT }}>
                  Nicht monogam
                </span>
              </button>

            </div>

            <div className="mt-auto pt-7">
              <ActionRow
                icon="IconArrowRight"
                label="Los geht's"
                accent={BRAND.blue}
                onClick={() => swiperRef?.slideNext()}
              />
            </div>
          </div>
        );
      }




      case SLIDE_REFLECTION:
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Feedback</span>
              </div>
              <h2 className="retro-heading w-full">Feedback</h2>
            </div>
            <div className="flex flex-col flex-1 w-full justify-between gap-4 mt-10 screen-only">
              {REFLECTION_FIELDS.map(([key, label, placeholder]) => (
                <PostItField
                  key={key}
                  accent={pillColorOf(SLIDE_REFLECTION)}
                  label={label}
                  placeholder={placeholder}
                  value={reflectionTexts[key] || ""}
                  onChange={(v) => setReflectionTexts({ ...reflectionTexts, [key]: v })}
                />
              ))}
            </div>
            {/* Print-only */}
            <div className="hidden print-only flex-col flex-1 w-full justify-between gap-4 mt-10">
              {REFLECTION_FIELDS.map(([key, label, placeholder]) => (
                <PostItField
                  key={key}
                  readOnly
                  minHeight={100}
                  accent={pillColorOf(SLIDE_REFLECTION)}
                  label={label}
                  placeholder={placeholder}
                  value={reflectionTexts[key] || ""}
                />
              ))}
            </div>

          </div>
        );

      case 7:
        return (
          <div className="flex flex-col items-start gap-14 w-full justify-center">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Intimacy</span>
              </div>
              <h2 className="retro-heading w-full">Sind wir uns körperlich nah?</h2>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Takeaways</span>
              </div>
              <h2 className="retro-heading w-full">
                Das nehmen wir aus der Retro mit
              </h2>
            </div>
            <div className="flex flex-col flex-1 w-full justify-between gap-6 mt-10 screen-only">
              {persons.map((person, idx) => (
                <PostItField
                  key={person.key}
                  accent={pillColorOf(8)}
                  label={personPlaceholder(person, idx, "Erkenntnisse", "Meine Erkenntnisse", "Erkenntnisse meines Partners")}
                  placeholder="z. B. wir reden zu selten über Geld – das ändern wir …"
                  value={takeawayTexts[person.key] || ""}
                  onChange={(v) => setTakeawayTexts({ ...takeawayTexts, [person.key]: v })}
                />
              ))}
            </div>
            {/* Print-only: takeaway notes with line breaks per person */}
            <div className="hidden print-only flex-col flex-1 w-full justify-between gap-6 mt-10">
              {persons.map((person, idx) => (
                <PostItField
                  key={person.key}
                  readOnly
                  minHeight={120}
                  accent={pillColorOf(8)}
                  label={personPlaceholder(person, idx, "Erkenntnisse", "Meine Erkenntnisse", "Erkenntnisse meines Partners")}
                  placeholder="z. B. wir reden zu selten über Geld – das ändern wir …"
                  value={takeawayTexts[person.key] || ""}
                />
              ))}
            </div>

          </div>
        );

      case 9:
        return (
          <div className="flex flex-col items-center w-full h-full">
            <div className="flex flex-col items-center gap-6 w-full text-center flex-1 justify-center">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Archive</span>
              </div>
              <h2 className="retro-heading w-full">Sichert eure Inhalte</h2>
            </div>
            <div className="flex flex-col items-start gap-3 w-full">
              <ActionRow
                icon="IconDownload"
                label="Ergebnisse sichern"
                accent={pillColorOf(9)}
                onClick={() => window.print()}
              />
              <ActionRow
                icon="IconTrash"
                label="Meine Einträge löschen"
                accent={pillColorOf(9)}
                onClick={() => clearAllUserData()}
              />
            </div>
          </div>
        );

      case 10:
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Questions</span>
              </div>
              <h2 className="retro-heading w-full">
                {questionsLoaded && currentQuestion ? currentQuestion : "Frage wird geladen..."}
              </h2>
            </div>
            <div className="absolute z-40 flex items-center" style={{ left: '28px', bottom: '28px' }}>
              <ActionRow
                icon="IconRefresh"
                label="Nächste Frage"
                accent={pillColorOf(10)}
                onClick={getRandomQuestion}
              />
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="bg-retro-black text-retro-white overflow-hidden select-none flex flex-col"
      style={{
        height: `${viewportHeight}px`,
        minHeight: `${viewportHeight}px`,
        maxHeight: `${viewportHeight}px`,
        overflowY: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Header spacer */}
      <div className="w-full px-4 py-2" />


      {/* Card Content - Swiper.js slide animation like friends app */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden pt-2 pb-4">
        {/* Edge click zones for slide navigation */}
        <button
          aria-label="Vorherige Karte"
          onClick={(e) => { e.stopPropagation(); navigateCard("prev"); }}
          className="swiper-no-swiping absolute left-0 top-0 bottom-0 w-11 z-40 bg-transparent border-0 p-0 cursor-w-resize screen-only"
        />
        <button
          aria-label="Nächste Karte"
          onClick={(e) => { e.stopPropagation(); navigateCard("next"); }}
          className="swiper-no-swiping absolute right-0 top-0 bottom-0 w-11 z-40 bg-transparent border-0 p-0 cursor-e-resize screen-only"
        />
        <div className="w-full h-full min-h-0 overflow-hidden">

            <Swiper
            modules={[Navigation, Pagination, Keyboard]}
            keyboard={{ enabled: true, onlyInViewport: true, pageUpDown: false }}
            spaceBetween={0}
            slidesPerView={1}
            speed={500}
            initialSlide={currentCard}
            onSwiper={setSwiperRef}
            onSlideChange={handleSlideChange}
            allowTouchMove={!draggingMemoji}
            simulateTouch={true}
            touchEventsTarget="container"
            touchReleaseOnEdges={true}
            edgeSwipeDetection={false}
            passiveListeners={true}
            className="h-full min-h-0"
            style={{ height: '100%', width: '100%', minHeight: 0 }}
            effect="slide"
            resistance={true}
            resistanceRatio={0.35}
            touchStartPreventDefault={false}
            touchMoveStopPropagation={false}
            threshold={3}
            touchRatio={1.4}
            touchAngle={45}
            followFinger={true}
            grabCursor={true}
            shortSwipes={true}
            longSwipes={true}
            longSwipesRatio={0.25}
            longSwipesMs={250}
            noSwipingClass="swiper-no-swiping"
            noSwiping={true}
          >
            {slides.map((slideId, index) => {
              const baseTheme = CARD_THEMES[index % CARD_THEMES.length];
              // Per-slide color overrides (square = pill, icon = pillDot)
              const overrides: Record<number, { pill: string; pillDot: string }> = {
                0: { pill: BRAND.purple, pillDot: BRAND.darkPurple },
                1: { pill: BRAND.stackOrange, pillDot: BRAND.mediumOrange },
                2: { pill: BRAND.stackOrange, pillDot: BRAND.mediumOrange },
                3: { pill: BRAND.green, pillDot: BRAND.darkGreen },
                7: { pill: BRAND.darkPurple, pillDot: BRAND.white },
                8: { pill: BRAND.blue, pillDot: BRAND.lightBlue },
                [SLIDE_REFLECTION]: { pill: BRAND.pink, pillDot: BRAND.darkPink },
              };
              const ov = overrides[slideId];
              const theme = ov ? { ...baseTheme, accent: ov.pill, ...ov } : baseTheme;
              // Convert theme.text hex to rgb triplet for --retro-white-rgb
              const hex = theme.text.replace('#', '');
              const r = parseInt(hex.slice(0, 2), 16);
              const g = parseInt(hex.slice(2, 4), 16);
              const b = parseInt(hex.slice(4, 6), 16);
              const textRgb = `${r} ${g} ${b}`;
              const pillHex = theme.pill.replace('#', '');
              const pr = parseInt(pillHex.slice(0, 2), 16);
              const pg = parseInt(pillHex.slice(2, 4), 16);
              const pb = parseInt(pillHex.slice(4, 6), 16);
              const mixC = (c: number) => Math.round(c * 0.12 + 9 * 0.88);
              const bodyBg = "#201C1D";
              const cardStyle = { backgroundColor: slideId === 4 ? '#FFFFFF' : theme.bg, ['--retro-white-rgb' as any]: textRgb, ['--retro-post-it' as any]: '#E4E6E8', ['--retro-post-it-text' as any]: theme.text, ['--retro-pill' as any]: theme.pill, ['--retro-pill-dot' as any]: theme.pillDot, ['--retro-body-bg' as any]: bodyBg } as React.CSSProperties;
              return (
              <SwiperSlide key={slideId} className="h-full min-h-0 overflow-hidden">
                <div className="w-full h-full min-h-0 flex flex-col items-center overflow-hidden px-[28px]">

                  {SLIDE_PILLS[slideId] && (
                    <div className="w-full max-w-[500px] mx-auto flex" style={{ marginBottom: '8px', ['--retro-pill' as any]: theme.pill, ['--retro-pill-dot' as any]: theme.pillDot } as React.CSSProperties}>
                      <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                        <span className="retro-label" style={slideId === SLIDE_LOGO ? { color: '#FF5E00' } : undefined}>{SLIDE_PILLS[slideId]}</span>
                      </div>
                    </div>
                  )}
                  <div
                    className="retro-card-container relative flex-1 w-full max-w-[500px] max-h-[720px] min-h-0 mx-auto flex flex-col justify-start items-start gap-4 rounded-none p-[28px] shadow-2xl overflow-y-auto"

                    style={{
                      ...cardStyle,
                      ...(slidesWithEditButton.includes(slideId) && (slideId !== 3 || editModeSlides[slideId])
                        ? { paddingBottom: (slideId === 1 || slideId === 2) && !editModeSlides[slideId] ? '112px' : '72px' }
                        : {}),
                    }}

                  >




                    {/* Edit Mode View */}
                    {editModeSlides[slideId] && slidesWithEditButton.includes(slideId) ? (
                      <div className="absolute inset-0 p-[28px] flex flex-col z-30 rounded-none" style={{ ...cardStyle, paddingBottom: '76px' }}>
                        {/* Question text - animated to top left, smaller, with right padding for close icon */}

                        <h2 
                          className="retro-body mb-6 pr-12 animate-[slideUp_0.15s_ease-in-out_forwards]"
                          style={{ fontSize: '16px', lineHeight: 1.4, color: '#201C1D' }}
                        >
                          {activeQuestion[slideId]?.label || getSlideQuestion(slideId)}
                        </h2>
                        
                        {/* Post-it notes — one per person */}
                        <div className="flex flex-col flex-1 gap-4 w-full animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
                          {persons.map((person, idx) => {
                            const aq = activeQuestion[slideId];
                            const noteKey = aq ? `q${aq.idx}-${person.key}` : person.key;
                            return (
                              <PostItField
                                key={noteKey}
                                accent={pillColorOf(slideId)}
                                label={personPlaceholder(person, idx, "Notizen", "Meine Notizen", "Notizen meines Partners")}
                                placeholder="z. B. was uns dazu gerade eingefallen ist …"
                                value={editModeNotes[slideId]?.[noteKey] || ""}
                                onChange={(v) =>
                                  setEditModeNotes(prev => ({
                                    ...prev,
                                    [slideId]: { ...(prev[slideId] || {}), [noteKey]: v }
                                  }))
                                }
                              />

                            );
                          })}
                        </div>
                      </div>
                    ) : renderCard(slideId)}

                    {/* Edit/Close action row - bottom left */}
                    {slidesWithEditButton.includes(slideId) && (slideId !== 3 || editModeSlides[slideId]) && (
                      <div className="absolute z-40 screen-only" style={{ left: '28px', bottom: (slideId === 1 || slideId === 2) && !editModeSlides[slideId] ? '68px' : '28px' }}>
                        <ActionRow
                          icon={editModeSlides[slideId] ? "IconClear" : "IconPencil"}
                          label={editModeSlides[slideId] ? "Fertig" : "Macht Notizen"}
                          accent={pillColorOf(slideId)}
                          onClick={() => toggleEditMode(slideId)}
                        />
                      </div>
                    )}



                    {/* Left navigation zone (32px wide) */}
                    {index > 0 && !editModeSlides[slideId] && (
                      <div
                        onClick={() => navigateCard("prev")}
                        className="absolute left-0 top-0 w-8 h-full cursor-pointer z-20"
                        style={{ width: "32px" }}
                      />
                    )}

                    {/* Right navigation zone (32px wide) */}
                    {index < totalCards - 1 && !editModeSlides[slideId] && (
                      <div
                        onClick={() => navigateCard("next")}
                        className="absolute right-0 top-0 w-8 h-full cursor-pointer z-20"
                        style={{ width: "32px" }}
                      />
                    )}
                  </div>
                </div>
              </SwiperSlide>
              );
            })}
          </Swiper>

        </div>

        {/* Print-only: All slides with notes interleaved in correct order */}
        <div className="hidden print-slides-container">
          {slides.map((slideId, index) => (
            <div key={`print-${slideId}`} className="contents">
              {/* Skip Logo, Intro, Setup, Archive (9) and Questions (10) in print */}
              {slideId !== SLIDE_LOGO && slideId !== SLIDE_INTRO && slideId !== SLIDE_SETUP && slideId !== 9 && slideId !== 10 && (
                <div className="print-slide-page" style={{ order: index * 2 }}>
                  <div className="retro-card-container relative flex flex-col justify-center items-start gap-10 bg-retro-card-bg rounded-[28px]">
                    {renderCard(slideId)}
                  </div>
                </div>
              )}
              
              {/* Notes page right after its slide - on its own page */}
              {slidesWithEditButton.includes(slideId) && persons.some(p => (editModeNotes[slideId]?.[p.key] || "").trim()) && (
                <div className="print-slide-page print-notes-page" style={{ order: index * 2 + 1 }}>
                  <div className="retro-card-container relative flex flex-col items-start bg-retro-card-bg rounded-[28px]">
                    {/* Question text */}
                    <h2 
                      className="retro-body mb-6"
                      style={{ fontSize: '16px', lineHeight: 1.4 }}
                    >
                      {getSlideQuestion(slideId)} — Notizen
                    </h2>
                    
                    {/* Post-it notes — one per person with content */}
                    <div className="flex flex-col flex-1 gap-4 w-full">
                      {persons.map((person) => {
                        const text = editModeNotes[slideId]?.[person.key];
                        if (!text) return null;
                        return (
                          <div key={person.key} className="w-full flex-1 p-3 bg-retro-post-it text-[#201C1D] text-base whitespace-pre-wrap min-h-[120px]">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots (centered) + counter at card edge */}
      <div className="relative w-full px-5 pb-4 min-h-[22px] flex items-center screen-only">
        <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
          {slides.map((slideId, i) => (
            <button
              key={slideId}
              type="button"
              aria-label={`Zu Karte ${i + 1}`}
              aria-current={i === currentCard}
              onClick={(e) => { e.stopPropagation(); swiperRef?.slideTo(i); }}
              className="h-1.5 rounded-full transition-all duration-300 border-0 p-0 cursor-pointer"
              style={{
                width: i === currentCard ? 20 : 6,
                background: CARD_THEMES[i % CARD_THEMES.length].pill,
                opacity: i === currentCard ? 1 : 0.35,
              }}
            />
          ))}
        </div>
        <div
          className="absolute right-5 top-1/2 -translate-y-1/2 retro-body text-retro-white"
          style={{ opacity: 0.25 }}
        >
          {currentCard + 1} / {totalCards}
        </div>
      </div>




      {/* Camera Preview Modal */}
      {cameraStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(32, 28, 29, 0.9)' }}>
          <div className="overflow-hidden max-w-md w-full" style={{ background: '#FFFFFF' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video object-cover"
            />
            <div className="p-4 flex gap-3 justify-center">
              <button
                onClick={takePicture}
                className="px-6 py-2 rounded-full retro-label"
                style={{ background: '#201C1D', color: '#FFFFFF' }}
              >
                Foto aufnehmen
              </button>
              <button
                onClick={closeCameraPreview}
                className="px-6 py-2 rounded-full retro-label"
                style={{ background: '#F0EFEE', color: '#201C1D' }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetroCards;