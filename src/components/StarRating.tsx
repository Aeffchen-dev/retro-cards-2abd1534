import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { intimacyScale, intimacyStars } from "./intimacy-rating";

interface StarRatingProps {
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  const hearts = intimacyStars(value);
  return (
    <div className="intimacy-rating swiper-no-swiping" role="group" aria-label="Wie zufrieden bist du mit unserem Sex?">
      {[1, 2, 3, 4, 5].map(heart => (
        <div key={heart} className="intimacy-star" data-fill={hearts >= heart ? "full" : hearts >= heart - 0.5 ? "half" : "empty"}>
          <Heart className="intimacy-heart-outline" strokeWidth={1.5} aria-hidden="true" />
          <span className="intimacy-heart-fill" aria-hidden="true"><Heart strokeWidth={1.5} /></span>
          {!readOnly && [heart - 0.5, heart].map((rating, half) => (
            <Button
              key={rating}
              type="button"
              variant="ghost"
              className="intimacy-heart-hit"
              data-half={half === 0 ? "left" : "right"}
              aria-label={`${String(rating).replace(".", ",")} ${rating === 1 ? "Herz" : "Herzen"}`}
              aria-pressed={rating === hearts}
              onClick={event => { event.stopPropagation(); onChange(intimacyScale(rating)); }}
            />
          ))}
        </div>
      ))}
      {readOnly && <span className="sr-only">{hearts} von 5 Herzen</span>}
    </div>
  );
}
