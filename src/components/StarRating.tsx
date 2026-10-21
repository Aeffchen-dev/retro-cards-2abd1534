import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intimacyScale, intimacyStars } from "./intimacy-rating";

interface StarRatingProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const hearts = intimacyStars(value);
  return (
    <div className="intimacy-rating swiper-no-swiping" role="group" aria-label="Wie zufrieden bist du mit unserem Sex?">
      {[1, 2, 3, 4, 5].map(heart => (
        <Button
          key={heart}
          type="button"
          variant="ghost"
          size="icon"
          className="intimacy-star"
          aria-label={`${heart} ${heart === 1 ? "Herz" : "Herzen"}`}
          aria-pressed={heart === hearts}
          data-filled={heart <= hearts}
          onClick={event => { event.stopPropagation(); onChange(intimacyScale(heart)); }}
        >
          <Heart strokeWidth={1.5} />
        </Button>
      ))}
    </div>
  );
}
