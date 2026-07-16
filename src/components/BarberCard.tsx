import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Stars from './Stars';
import { categoryById, type DecoratedBarber } from '@/lib/demo';
import { toPersianNum } from '@/lib/format';

/** Horizontal featured card used on the home page. */
export default function BarberCard({ barber }: { barber: DecoratedBarber }) {
  const navigate = useNavigate();
  const tags = barber.categories.slice(0, 2).map(categoryById);

  return (
    <div className="barber-card" onClick={() => navigate(`/barber/${barber.id}`)}>
      {barber.featured && <span className="featured-badge">پیشنهادی</span>}
      <div className="barber-card-top">
        <Avatar initial={barber.initial} color={barber.color} />
        <div>
          <h3>{barber.name}</h3>
          <div className="barber-card-salon">{barber.specialty}</div>
          <Stars rating={barber.rating} />
          <span className="rating-count">({toPersianNum(barber.reviews)} نظر)</span>
        </div>
      </div>
      <div className="barber-card-body">
        <div className="barber-card-tags">
          {tags.map((c) => c && <span key={c.id} className="tag-pill">{c.name}</span>)}
        </div>
        <div className="barber-card-footer">
          <span className="barber-card-price">{barber.salon}</span>
          <span className="barber-card-cta">رزرو نوبت</span>
        </div>
      </div>
    </div>
  );
}
