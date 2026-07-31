import React, { useEffect, useRef, useState } from "react";

export interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  starColor?: string;
  className?: string;
  /** Fixed pixel size per star. When set, the row hugs its content instead of stretching. */
  starSize?: number;
}

const starPath =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

/** Half-step star rating, ported from the Year Planning project. */
const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  readonly = false,
  starColor = "currentColor",
  className = "",
  starSize,
}) => {
  const [rating, setRating] = useState(value);
  const [hoverRating, setHoverRating] = useState(0);
  const componentId = useRef(Math.random().toString(36).substring(2, 11)).current;

  useEffect(() => {
    setRating(value);
  }, [value]);

  const handleClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (readonly) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;

    if (newRating === rating) {
      const decreased = Math.max(0, newRating - 0.5);
      setRating(decreased);
      onChange?.(decreased);
    } else {
      setRating(newRating);
      onChange?.(newRating);
    }
  };

  const getStarFill = (starIndex: number) => {
    const current = hoverRating > 0 ? hoverRating : rating;
    if (current >= starIndex) return 1;
    if (current > starIndex - 1) return current - (starIndex - 1);
    return 0;
  };

  return (
    <div className={`swiper-no-swiping flex ${starSize ? "w-auto" : "w-full"} gap-2 ${className}`}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillLevel = getStarFill(starIndex);
        const clipId = `clip-${componentId}-${starIndex}`;
        return (
          <button
            key={starIndex}
            type="button"
            className={`${starSize ? "shrink-0" : "flex-1"} aspect-square cursor-pointer transition-colors duration-200`}
            style={{ color: starColor, touchAction: "manipulation", ...(starSize ? { width: starSize, height: starSize } : {}) }}
            onClick={(e) => handleClick(starIndex, e)}
            onMouseEnter={() => !readonly && setHoverRating(starIndex)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onTouchStart={() => !readonly && setHoverRating(starIndex)}
            onTouchEnd={() => !readonly && setHoverRating(0)}
            disabled={readonly}
            aria-label={`${starIndex} von 5`}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path d={starPath} stroke="currentColor" strokeWidth="1" fill="none" />
              {fillLevel > 0 && (
                <g>
                  <defs>
                    <clipPath id={clipId}>
                      <rect x="0" y="0" width={`${fillLevel * 100}%`} height="100%" />
                    </clipPath>
                  </defs>
                  <path d={starPath} fill="currentColor" clipPath={`url(#${clipId})`} />
                </g>
              )}
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
