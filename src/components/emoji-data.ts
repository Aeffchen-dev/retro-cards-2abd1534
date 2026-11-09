// Curated emoji sets for the Setup slide's picker. German labels, German+English
// search keywords; the picker only ever offers these, so a picked value is always
// a single emoji grapheme.
export interface EmojiGroup {
  id: string;
  label: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'faces',
    label: 'Gesichter',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
      '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤔', '🤭', '🤫',
      '🤨', '😐', '😶', '😏', '😒', '🙄', '😬', '😌', '😔', '😪',
      '🤤', '😴', '😷', '🥵', '🥶', '😱', '😨', '😰', '😥', '😢',
      '😭', '😡', '🤬', '🤯', '😳', '🥺', '😮', '😲', '🥱', '😎',
      '🤓', '🧐', '🥳', '😈', '🤡', '👻', '🤖', '💩',
    ],
  },
  {
    id: 'hearts',
    label: 'Herzen & Liebe',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
      '💌', '💋', '🌹', '🥀', '🫶',
    ],
  },
  {
    id: 'hands',
    label: 'Hände & Gesten',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝',
      '🙏', '💪', '🫰', '🤲', '👐', '🙌', '👏', '🫡',
    ],
  },
  {
    id: 'people',
    label: 'Menschen',
    emojis: [
      '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '🧓', '👵', '👴',
      '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '👱‍♀️', '👱‍♂️', '👩‍🦳', '👨‍🦳', '🧑‍🦲', '🕵️',
      '🎅', '🦸', '🧙', '🧚', '🧛', '🧞', '🧜', '🧑‍🚀', '👯‍♀️', '👯‍♂️',
      '🧘', '🏃', '💑', '👫', '👬', '👭', '🫂',
    ],
  },
  {
    id: 'nature',
    label: 'Tiere & Natur',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐷',
      '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐙', '🦀', '🐬',
      '🐳', '🦈', '🐊', '🐅', '🦓', '🦍', '🐘', '🦒', '🌸', '🌹',
      '🌻', '🌺', '🌷', '🌱', '🪴', '🌲', '🍀', '🍁', '🌙', '☀️',
      '⭐', '✨', '🌈', '🔥', '💧', '🌊', '⛰️', '🏝️',
    ],
  },
  {
    id: 'food',
    label: 'Essen & Trinken',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥐', '🍞',
      '🧀', '🍕', '🍔', '🍟', '🌮', '🥗', '🍜', '🍝', '🍣', '🍰',
      '🎂', '🍩', '🍪', '🍫', '🍬', '☕', '🍵', '🍺', '🍷', '🥂',
      '🥞',
    ],
  },
  {
    id: 'activity',
    label: 'Aktivität & Objekte',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊',
      '🎮', '🎧', '🎤', '🎸', '🎹', '🥁', '🎨', '🎬', '📚', '✈️',
      '🚗', '🚌', '🏍️', '🚲', '🚀', '🏠', '💡', '🔑', '⏰', '📱',
      '💻', '📷', '🎁', '🎈', '🎉', '🎊', '🕯️', '💬', '💭', '💤',
    ],
  },
  {
    id: 'symbols',
    label: 'Symbole',
    emojis: [
      '✅', '❌', '⭕', '❗', '❓', '💯', '🔔', '💢', '💫', '🌀',
      '♾️', '✔️', '☑️', '➕', '➖', '🔴', '🟠', '🟡', '🟢', '🔵',
      '🟣', '⚫', '⚪', '🟤', '♻️', '🆗', '🆒',
    ],
  },
];

// Extra words a search can hit besides the group label. Keys are the emoji itself.
const KEYWORDS: Record<string, string> = {
  '😀': 'grinsen freude', '😂': 'lachen lol', '🤣': 'lachen rolle',
  '😊': 'lächeln happy', '🙂': 'lächeln', '😉': 'zwinkern',
  '😍': 'verliebt schwärmen', '🥰': 'verliebt kuschel', '😘': 'kuss küssen',
  '😎': 'cool sonnenbrille', '🤩': 'stern augen beeindrucken',
  '🥳': 'party feier konfetti', '😢': 'traurig weinen', '😭': 'weinen heulen',
  '😡': 'wut ärger', '🤯': 'schock unglaublich', '🥺': 'bitte treue augen',
  '😴': 'müde schlafen', '🤤': 'lecker schlecken', '🤗': 'umarmung drücken',
  '🤔': 'nachdenken überlegen', '😏': 'grinsen schlag',
  '❤️': 'herz liebe love', '🧡': 'herz orange', '💛': 'herz gelb',
  '💚': 'herz grün', '💙': 'herz blau', '💜': 'herz lila violett',
  '🖤': 'herz schwarz', '🤍': 'herz weiss', '🤎': 'herz braun',
  '💔': 'herz gebrochen trennung', '💕': 'herzen liebe', '💖': 'herz funkel',
  '💘': 'herz amor cupido', '💝': 'herz geschenk', '💌': 'liebesbrief gruss',
  '💋': 'kuss lippen', '🌹': 'rose blume', '🫶': 'herz hände gest',
  '👍': 'daumen hoch gut', '👎': 'daumen runten schlecht',
  '👌': 'ok perfekt', '✌️': 'peace sieg', '🤞': 'drücken glück',
  '🙏': 'bitte danke gebet', '💪': 'stark muskel kraft', '👋': 'hallo tschüss wink',
  '🤝': 'handschlag deal', '👏': 'klatschen applaud', '🙌': 'hände hoch feiern',
  '🫡': 'salut respekt',
  '🧚': 'fee elf', '🦸': 'held super', '🧙': 'zauberer hexe',
  '👫': 'paar hand in hand', '💑': 'paar liebe', '🫂': 'umarmung kuschel',
  '🐶': 'hund wauzi', '🐱': 'katze miau', '🐰': 'hase kaninchen',
  '🦊': 'fuchs', '🐻': 'bär', '🐼': 'panda', '🦄': 'einhorn',
  '🐝': 'biene honig', '🦋': 'schmetterling', '🐬': 'delfin',
  '🌹': 'rose blume', '🌻': 'sonnenblume blume', '🌷': 'tulpe blume',
  '🌸': 'blüte kirsch', '🍀': 'glück klee', '🌙': 'mond nacht',
  '☀️': 'sonne sommer', '⭐': 'stern', '✨': 'funkel glitzer',
  '🌈': 'regenbogen', '🔥': 'feuer heiss hot', '🌊': 'welle meer',
  '🍕': 'pizza', '🍔': 'burger', '🍦': 'eis', '🍫': 'schokolade',
  '🍰': 'kuchen torte', '🎂': 'geburtstag torte', '☕': 'kaffee',
  '🍷': 'wein', '🍺': 'bier', '🥂': 'prost anstossen',
  '⚽': 'fussball', '🎮': 'spiel konsole zocken', '🎧': 'musik kopfhörer',
  '🎸': 'gitarre musik', '🎬': 'film kino', '📚': 'bücher lesen',
  '✈️': 'urlaub flug fliegen', '🚗': 'auto fahrt', '🏠': 'zuhause zuhause',
  '💡': 'idee licht', '⏰': 'zeit uhr', '🎁': 'geschenk',
  '🎉': 'feier konfetti', '🎈': 'ballon luftballon',
  '💯': 'hundert perfekt', '✅': 'haken ok ja', '❌': 'kreuz nein falsch',
  '❓': 'frage', '❗': 'ausrufezeichen wichtig', '🔔': 'glocke reminder',
  '♾️': 'unendlich', '💫': 'stern schwindel',
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Groups whose emojis match the query; empty query returns every group. */
export function filterEmojis(query: string): EmojiGroup[] {
  const q = norm(query);
  if (!q) return EMOJI_GROUPS;
  const out: EmojiGroup[] = [];
  for (const group of EMOJI_GROUPS) {
    const labelHit = norm(group.label).includes(q);
    const hits = group.emojis.filter((e) => {
      if (labelHit) return true;
      const kw = KEYWORDS[e];
      return kw ? norm(kw).includes(q) : false;
    });
    if (hits.length) out.push({ ...group, emojis: hits });
  }
  return out;
}

/** Every emoji the picker offers, in group order. */
export const ALL_EMOJIS: string[] = EMOJI_GROUPS.flatMap((g) => g.emojis);
