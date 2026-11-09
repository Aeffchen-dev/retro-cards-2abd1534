import React, { useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EMOJI_GROUPS, filterEmojis } from '@/components/emoji-data';

/*
  Emoji selection for the Setup slide's emoji field. The field itself is a
  read-only display tile — tapping it (or the label button) opens this panel
  instead of the on-screen keyboard, so nobody has to hunt for the emoji key.
  The panel is portalled outside #root, so it carries its own font.
*/

interface EmojiPickerProps {
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  /** tile colour of the field */
  accent: string;
  /** text colour on the tile */
  onAccent: string;
  /** grey fill of the label button */
  fieldBg: string;
  /** dark text colour */
  text: string;
  label?: string;
  ariaLabel?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value,
  placeholder,
  onChange,
  accent,
  onAccent,
  fieldBg,
  text,
  label = 'Emoji auswählen',
  ariaLabel = 'Emoji auswählen',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const groups = useMemo(() => filterEmojis(query), [query]);

  const pick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={(e) => e.stopPropagation()}
          className="emoji-field-trigger swiper-no-swiping inline-flex h-8 self-start items-center gap-0 rounded-none border-none bg-transparent p-0"
        >
          <span
            className="emoji-field-tile flex h-8 w-8 shrink-0 items-center justify-center text-base"
            style={{ background: accent, color: onAccent }}
          >
            {value || placeholder}
          </span>
          <span
            className="retro-body-copy flex h-8 items-center whitespace-nowrap rounded-none px-3"
            style={{ background: fieldBg, color: text }}
          >
            {label}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="emoji-popover swiper-no-swiping"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
        onKeyDown={(e) => {
          // Keep the deck's card paging (arrow keys) from stealing keys typed here.
          if (e.key.startsWith('Arrow')) e.stopPropagation();
        }}
      >
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen – z. B. Herz"
          aria-label="Emoji suchen"
          className="emoji-search retro-input retro-input-dark-text"
        />
        <div className="emoji-list" role="listbox" aria-label="Emoji auswählen">
          {groups.length === 0 && <p className="emoji-empty">Kein Emoji gefunden</p>}
          {groups.map((group) => (
            <section key={group.id} className="emoji-group">
              <h3 className="emoji-group-label">{group.label}</h3>
              <div className="emoji-grid">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="option"
                    aria-selected={emoji === value}
                    aria-label={emoji}
                    onClick={() => pick(emoji)}
                    className="emoji-cell"
                    data-selected={emoji === value ? 'true' : undefined}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
