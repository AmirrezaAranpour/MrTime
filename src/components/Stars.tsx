import { toPersianNum } from '@/lib/format';

function Star({ fill, opacity = 1 }: { fill: string; opacity?: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="none" opacity={opacity}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <span className="stars">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} fill="#F59E0B" />;
        if (i === full && half) return <Star key={i} fill="#F59E0B" opacity={0.5} />;
        return <Star key={i} fill="#E5E7EB" />;
      })}
      <span>{toPersianNum(rating.toFixed(1))}</span>
    </span>
  );
}
