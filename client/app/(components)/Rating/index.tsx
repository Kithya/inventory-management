import { Star } from "lucide-react";
import React from "react";

type RatingProps = {
  rating: number;
};

const Rating = ({ rating }: RatingProps) => {
  const safeRating = Math.max(0, Math.min(5, rating));

  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${safeRating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index <= Math.round(safeRating)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700"
          }`}
        />
      ))}
    </span>
  );
};

export default Rating;
