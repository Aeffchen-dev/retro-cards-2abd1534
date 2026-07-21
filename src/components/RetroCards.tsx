import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Download, Pencil, X, Trash2, Camera } from "lucide-react";
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

// Material 3 tonal palette — dark surfaces with varied hues so text-retro-white stays readable
const CARD_THEMES: { bg: string; blob: string; accent: string }[] = [
  { bg: "#381E72", blob: "#381E72", accent: "#D0BCFF" }, // deep violet
  { bg: "#EADDFF", blob: "#EADDFF", accent: "#4F378B" }, // lavender light
  { bg: "#4F378B", blob: "#4F378B", accent: "#EADDFF" }, // primary container
  { bg: "#D0BCFF", blob: "#D0BCFF", accent: "#381E72" }, // lavender
  { bg: "#211F26", blob: "#211F26", accent: "#D0BCFF" }, // near black surface
  { bg: "#7F67BE", blob: "#7F67BE", accent: "#EADDFF" }, // mid purple
  { bg: "#F6EDFF", blob: "#F6EDFF", accent: "#4F378B" }, // pale lavender
  { bg: "#5C3A7A", blob: "#5C3A7A", accent: "#D0BCFF" }, // plum
];


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
  const slidesWithEditButton = [1, 2, 3, SLIDE_REFLECTION, 5, 7];

  // Ordered list of visible slide ids — filters out dates if openRelationship is off
  const slides = useMemo(() => {
    const arr: number[] = [SLIDE_LOGO, SLIDE_INTRO, SLIDE_SETUP, 0, 1, 2, 3, SLIDE_REFLECTION, 4];
    if (setupData.openRelationship) arr.push(5);
    arr.push(7, 8, 9, 10);
    return arr;
  }, [setupData.openRelationship]);

  const totalCards = slides.length;

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
  }, []);

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
      [SLIDE_REFLECTION]: "Reflection",
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

  const navigateCard = useCallback((direction: "prev" | "next") => {
    if (!swiperRef) return;
    
    if (direction === "prev") {
      swiperRef.slidePrev();
    } else {
      swiperRef.slideNext();
    }
  }, [swiperRef]);

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
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label" style={{ lineHeight: 1, display: 'flex', alignItems: 'center' }}>Memory Time</span>
              </div>
              <h2 className="retro-heading w-full">
                Schießt ein paar süße Fotos zusammen
              </h2>
            </div>
            <div style={{ marginTop: "40px" }} className="screen-only">
              <button
                onClick={openCamera}
                className="cursor-pointer flex items-center justify-center"
                style={{ fontSize: '67px', lineHeight: 1 }}
              >
                📸
              </button>
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCamera();
              }}
              className="swiper-no-swiping relative z-40 mt-auto w-full flex items-center justify-center gap-3 retro-body-copy !text-[#381E72] bg-[#D0BCFF] rounded-full px-6 py-3 hover:opacity-90 transition-opacity"
            >
              <Camera size={18} strokeWidth={2} />
              Kamera öffnen
            </button>
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
        const defaultY = (i: number) => (isMobile ? 40 + i * 56 : 96 + i * 72);
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Health Check</span>
              </div>
              <h2 className="retro-heading w-full">{heading}</h2>
            </div>
            <div className="relative w-full flex-1 mt-10 print-memoji-container">
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
            <div className="w-full text-center retro-body mt-8 screen-only">
              Platziert eure Memojis auf der Skala
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
                Wie waren die letzten 4 Wochen? Was war los?
              </h2>
            </div>
            <div className="flex flex-col gap-4 w-full flex-1 justify-end">
              <div className="retro-body-copy">
                🏆&nbsp;&nbsp;&nbsp;Das habe(n) ich / wir richtig gerockt
              </div>
              <div className="retro-body-copy">
                🥰&nbsp;&nbsp;&nbsp;Ein schöner Moment
              </div>
              <div className="retro-body-copy">
                💡&nbsp;&nbsp;&nbsp;Das habe ich gelernt
              </div>
              <div className="retro-body-copy">
                💥&nbsp;&nbsp;&nbsp;Das hat mich Kraft gekostet
              </div>
              <div className="retro-body-copy">
                🧠&nbsp;&nbsp;&nbsp;Was beschäftigt mich grade?
              </div>
              <div className="retro-body-copy">
                💬&nbsp;&nbsp;&nbsp; Die letzten 4 Wochen in einem Wort
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-start w-full h-full relative">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">To talk about</span>
              </div>
              <h2 className="retro-heading w-full">
                Darüber möchte ich mit dir sprechen
              </h2>
            </div>
            <div className="flex flex-col flex-1 w-full justify-between gap-6 mt-10 screen-only">
              {persons.map((person, idx) => (
                <textarea
                  key={person.key}
                  value={postItTexts[person.key] || ""}
                  onChange={(e) =>
                    setPostItTexts({ ...postItTexts, [person.key]: e.target.value })
                  }
                  className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-lg"
                  style={{ borderRadius: "0px" } as React.CSSProperties}
                  placeholder={personPlaceholder(person, idx, "Themen", "Meine Themen", "Themen meines Partners")}
                />
              ))}
            </div>
            {/* Print-only: post-it notes like takeaways with line breaks */}
            <div className="hidden print-only flex-col flex-1 w-full justify-between gap-6 mt-10">
              {persons.map((person, idx) => (
                <div key={person.key} className="w-full flex-1 p-4 bg-retro-post-it text-black text-lg min-h-[120px] whitespace-pre-wrap">
                  {postItTexts[person.key] || personPlaceholder(person, idx, "Themen", "Meine Themen", "Themen meines Partners")}
                </div>
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
          <div className="flex flex-col items-center w-full h-full text-center" style={{ paddingTop: '35%' }}>
            <h1
              className="retro-title logo-slide-anim"
              style={{ fontSize: '64px', lineHeight: 1.05 }}
            >
              Retro Cards
            </h1>
            <p className="retro-body-copy mt-8 text-retro-white/50" style={{ fontSize: '16px', lineHeight: 1.5 }}>
              Ein interaktiver Check-in
              <br />
              für eine gesunde Beziehung
            </p>
          </div>
        );

      case SLIDE_INTRO:
        return (
          <div className="flex flex-col justify-center items-start w-full h-full">
            <div className="flex flex-col items-start gap-8 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Intro</span>
              </div>
              <div className="flex flex-col gap-4 w-full retro-body-copy">
                <p>Retro Cards ist euer monatlicher Check-in für eure Beziehung. Nehmt euch Zeit füreinander, sprecht ehrlich über das, was euch bewegt, und stärkt, was euch verbindet.</p>
                <p>Macht daraus euren Date-Abend. Schnappt euch euer Lieblingsgetränk, macht’s euch gemütlich und genießt ein gutes Gespräch.</p>
                <p>Hört einander zu, bleibt neugierig und denkt immer daran: Ihr seid ein Team. ❤️</p>
              </div>
            </div>
          </div>
        );

      case SLIDE_SETUP: {
        const nameInputCls = "swiper-no-swiping name-input-field retro-input retro-input-dark h-12 w-full rounded-lg bg-retro-white/5 border-none focus:outline-none focus:ring-2 focus:ring-black/20 px-2 text-base placeholder:text-base placeholder:text-retro-white/30";
        const emojiPicker = (
          value: string,
          placeholder: string,
          onChange: (val: string) => void
        ) => (
          <div className="relative shrink-0 w-12 h-12 rounded-lg">
            <input
              type="text"
              inputMode="text"
              value={value}
              onChange={(e) => onChange(sanitizeEmoji(e.target.value))}
              onFocus={(e) => e.currentTarget.select()}
              placeholder={placeholder}
              className="emoji-picker-input w-full h-full rounded-lg bg-retro-white/5 text-center text-2xl retro-input retro-input-dark border-none caret-transparent focus:outline-none focus:ring-2 focus:ring-black/20 focus:opacity-10"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D0BCFF] flex items-center justify-center pointer-events-none">
              <Pencil size={10} color="#161616" strokeWidth={2.5} />
            </div>
          </div>
        );
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Setup</span>
              </div>
            </div>
            <div className="flex flex-col w-full mt-8">
              {/* Person 1 */}
              <div className="flex items-center gap-4 w-full py-4">
                {emojiPicker(setupData.emoji1, EMOJI1_PLACEHOLDER, (val) => setSetupData({ ...setupData, emoji1: val }))}
                <div className="name-input-wrapper first-name-input-wrapper flex-1">
                  <input
                    type="text"
                    value={setupData.name1}
                    onChange={(e) => setSetupData({ ...setupData, name1: e.target.value })}
                    placeholder={NAME1_PLACEHOLDER}
                    className={nameInputCls}
                  />
                </div>
              </div>
              {/* Person 2 */}
              <div className="flex items-center gap-4 w-full py-4">
                {emojiPicker(setupData.emoji2, EMOJI2_PLACEHOLDER, (val) => setSetupData({ ...setupData, emoji2: val }))}
                <div className="name-input-wrapper flex-1">
                  <input
                    type="text"
                    value={setupData.name2}
                    onChange={(e) => setSetupData({ ...setupData, name2: e.target.value })}
                    placeholder={NAME2_PLACEHOLDER}
                    className={nameInputCls}
                  />
                </div>
              </div>
              {/* Extra partners */}
              {setupData.extraPartners.map((p, idx) => (
                <div key={idx} className="flex items-center gap-4 w-full py-4">
                  <div className="flex-1 flex items-center gap-4">
                    {emojiPicker(p.emoji, "🧚", (val) => {
                      const next = [...setupData.extraPartners];
                      next[idx] = { ...next[idx], emoji: val };
                      setSetupData({ ...setupData, extraPartners: next });
                    })}
                    <div className="name-input-wrapper flex-1">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...setupData.extraPartners];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setSetupData({ ...setupData, extraPartners: next });
                        }}
                        placeholder={`Partner ${idx + 3}`}
                        className={nameInputCls}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Partner entfernen"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = setupData.extraPartners.filter((_, i) => i !== idx);
                      setSetupData({ ...setupData, extraPartners: next });
                    }}
                    className="relative z-40 shrink-0 w-5 h-5 rounded-full bg-[#D0BCFF] flex items-center justify-center transition-transform hover:scale-105"
                  >
                    <X size={10} color="#161616" strokeWidth={2.5} />
                  </button>
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
                className="relative z-40 w-full flex items-center gap-0 py-4 text-retro-white/50 retro-body-copy transition-colors hover:text-retro-white/70 no-underline"
              >
                <span className="text-left whitespace-nowrap">
                  <span className="text-retro-white/50">+ </span>
                  Weiteren Partner hinzufügen
                </span>
              </button>
              {/* Toggle */}
              <div className="flex items-center w-full py-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSetupData({ ...setupData, openRelationship: !setupData.openRelationship });
                  }}
                  className="retro-body-copy text-left bg-transparent p-0 m-0 no-underline"
                >
                  Nicht monogam
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={setupData.openRelationship}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSetupData({ ...setupData, openRelationship: !setupData.openRelationship });
                  }}
                  className={`relative z-40 shrink-0 w-12 h-7 ml-4 rounded-full transition-colors ${setupData.openRelationship ? 'bg-[#D0BCFF]' : 'bg-retro-white/20'}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-retro-card-bg transition-transform ${setupData.openRelationship ? 'translate-x-5' : ''}`}
                  />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                swiperRef?.slideNext();
              }}
              className="relative z-40 mt-auto w-full retro-body-copy !text-[#381E72] bg-[#D0BCFF] rounded-full px-6 py-3 hover:opacity-90 transition-opacity"
            >
              Los geht's
            </button>
          </div>
        );
      }




      case SLIDE_REFLECTION:
        return (
          <div className="flex flex-col items-start w-full h-full">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="retro-pill flex justify-center items-center gap-2 rounded-full border border-retro-white">
                <span className="retro-label">Reflection</span>
              </div>
              <h2 className="retro-heading w-full">Reflection</h2>
            </div>
            <div className="flex flex-col flex-1 w-full gap-4 mt-8">
              <textarea
                value={reflectionTexts.nice}
                onChange={(e) => setReflectionTexts({ ...reflectionTexts, nice: e.target.value })}
                className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-base"
                style={{ borderRadius: "0px" }}
                placeholder="Das finde ich gerade schön in unserer Beziehung"
              />
              <textarea
                value={reflectionTexts.thanks}
                onChange={(e) => setReflectionTexts({ ...reflectionTexts, thanks: e.target.value })}
                className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-base"
                style={{ borderRadius: "0px" }}
                placeholder="Dafür möchte ich Danke sagen / ein Kompliment für dich"
              />
              <textarea
                value={reflectionTexts.idea}
                onChange={(e) => setReflectionTexts({ ...reflectionTexts, idea: e.target.value })}
                className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-base"
                style={{ borderRadius: "0px" }}
                placeholder="Eine Idee für uns / Das können wir besser machen"
              />
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
                <textarea
                  key={person.key}
                  value={takeawayTexts[person.key] || ""}
                  onChange={(e) =>
                    setTakeawayTexts({ ...takeawayTexts, [person.key]: e.target.value })
                  }
                  className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-lg"
                  style={{ borderRadius: "0px" } as React.CSSProperties}
                  placeholder={personPlaceholder(person, idx, "Erkenntnisse", "Meine Erkenntnisse", "Erkenntnisse meines Partners")}
                />
              ))}
            </div>
            {/* Print-only: takeaway notes with line breaks per person */}
            <div className="hidden print-only flex-col flex-1 w-full justify-between gap-6 mt-10">
              {persons.map((person, idx) => (
                <div key={person.key} className="w-full flex-1 p-4 bg-retro-post-it text-black text-lg min-h-[120px] whitespace-pre-wrap">
                  {takeawayTexts[person.key] || personPlaceholder(person, idx, "Erkenntnisse", "Meine Erkenntnisse", "Erkenntnisse meines Partners")}
                </div>
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
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-3 py-3 px-6 rounded-full bg-transparent hover:bg-retro-white/10 transition-colors cursor-pointer"
              >
                <Download size={20} className="text-retro-white" />
                <span className="retro-body">Ergebnisse sichern</span>
              </button>
              <button
                onClick={clearAllUserData}
                className="flex items-center gap-3 py-3 px-6 rounded-full bg-transparent hover:bg-retro-white/10 transition-colors cursor-pointer"
              >
                <Trash2 size={20} className="text-retro-white" />
                <span className="retro-body">Meine Einträge löschen</span>
              </button>
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
            <div className="flex-1 flex items-end justify-center w-full">
              <div
                onClick={getRandomQuestion}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <RefreshCw size={20} className="text-retro-white" />
                <span className="retro-body">Neue Frage</span>
              </div>
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
      {/* Header - Compact like friends app */}
      <div className="flex items-center gap-4 w-full px-4 py-3">
        <h1 className="retro-title" style={{ fontSize: '17.64px' }}>Retro Cards</h1>
        <div className="flex-1 text-right retro-body">
          {currentCard + 1} / {totalCards}
        </div>
      </div>

      {/* Card Content - Swiper.js slide animation like friends app */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden py-2 md:py-4">
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
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              return (
              <SwiperSlide key={slideId} className="h-full min-h-0 overflow-hidden">
                <div className="w-full h-full min-h-0 flex items-center justify-center overflow-hidden px-4">
                  <div 
                    className="retro-card-container relative h-full w-full max-w-[500px] max-h-[720px] min-h-0 mx-auto flex flex-col justify-start items-start gap-10 rounded-[28px] p-8 shadow-2xl overflow-y-auto"
                    style={{ backgroundColor: theme.bg }}
                  >
                    {/* Decorative M3 blob */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-2xl"
                      style={{ backgroundColor: theme.blob }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
                      style={{ backgroundColor: theme.accent }}
                    />

                    {/* Edit Mode View */}
                    {editModeSlides[slideId] && slidesWithEditButton.includes(slideId) ? (
                      <div className="absolute inset-0 p-8 flex flex-col z-30 rounded-[28px]" style={{ backgroundColor: theme.bg }}>
                        {/* Question text - animated to top left, smaller, with right padding for close icon */}

                        <h2 
                          className="retro-body text-retro-white/80 mb-6 pr-12 animate-[slideUp_0.15s_ease-in-out_forwards]"
                          style={{ fontSize: isMobile ? '14px' : '16px', lineHeight: 1.4 }}
                        >
                          {getSlideQuestion(slideId)}
                        </h2>
                        
                        {/* Post-it notes — one per person */}
                        <div className="flex flex-col flex-1 gap-4 w-full animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
                          {persons.map((person, idx) => (
                            <textarea
                              key={person.key}
                              value={editModeNotes[slideId]?.[person.key] || ""}
                              onChange={(e) =>
                                setEditModeNotes(prev => ({
                                  ...prev,
                                  [slideId]: { ...(prev[slideId] || {}), [person.key]: e.target.value }
                                }))
                              }
                              className="w-full flex-1 p-4 bg-retro-post-it retro-input retro-input-light border-none text-lg"
                              style={{ borderRadius: "0px" }}
                              placeholder={personPlaceholder(person, idx, "Notizen", "Meine Notizen", "Notizen meines Partners")}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {renderCard(slideId)}
                      </>
                    )}

                    {/* Edit/Close button - top right with 48x48 touch target */}
                    {slidesWithEditButton.includes(slideId) && (
                      <button
                        onClick={() => toggleEditMode(slideId)}
                        className="swiper-no-swiping absolute top-4 right-4 w-12 h-12 flex items-center justify-center z-40 cursor-pointer hover:opacity-80 transition-all duration-300 screen-only"
                        style={{ touchAction: 'manipulation' }}
                      >
                        {editModeSlides[slideId] ? (
                          <X size={32} strokeWidth={1} className="text-retro-white" />
                        ) : (
                          <Pencil size={24} strokeWidth={1} className="text-retro-white" />
                        )}
                      </button>
                    )}

                    {/* Navigation hint on first card */}
                    {index === 0 && (
                      <div className="absolute bottom-8 left-8 right-8 text-center retro-body">
                        Swipe um weiter zu navigieren
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
            <React.Fragment key={`print-${slideId}`}>
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
                          <div key={person.key} className="w-full flex-1 p-4 bg-retro-post-it text-black text-lg whitespace-pre-wrap min-h-[120px]">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* Camera Preview Modal */}
      {cameraStream && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden max-w-md w-full">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                📸 Foto aufnehmen
              </button>
              <button
                onClick={closeCameraPreview}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ❌ Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetroCards;