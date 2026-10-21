import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intimacyScale, intimacyStars } from "./intimacy-rating";

interface StarRatingProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const stars = intimacyStars(value);
  return (
    <div className="intimacy-rating swiper-no-swiping" role="group" aria-label="Intimität bewerten">
      {[1, 2, 3, 4, 5].map(star => (
        <Button
          key={star}
          type="button"
          variant="ghost"
          size="icon"
          className="intimacy-star"
          aria-label={`${star} ${star === 1 ? "Stern" : "Sterne"}`}
          aria-pressed={star === stars}
          data-filled={star <= stars}
          onClick={event => { event.stopPropagation(); onChange(intimacyScale(star)); }}
        >
          <Star strokeWidth={1.5} />
        </Button>
      ))}
    </div>
  );
}