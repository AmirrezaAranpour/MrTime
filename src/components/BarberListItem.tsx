import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Stars from './Stars';
import { ClockIcon } from './icons';
import { categoryById, type DecoratedBarber } from '@/lib/demo';
import { toPersianNum } from '@/lib/format';

/** Full-width row used on the search/list page. */
export default function BarberListItem({ barber }: { barber: DecoratedBarber }) {
  const navigate = useNavigate();
  const tags = barber.categories.slice(0, 3).map(categoryById);

  return (
    <div className="barber-list-item" onClick={() => navigate(`/barber/${barber.id}`)}>
      <Avatar initial={barber.initial} color={barber.color} size="avatar-lg" />
      <div className="barber-list-info">
        <h3>{barber.name}</h3>
        <div className="barber-list-meta">
          {barber.salon} · {barber.address}
        </div>
        <div style={{ marginBottom: 6 }}>
          <Stars rating={barber.rating} /> <span className="rating-count">({toPersianNum(barber.reviews)})</span>
        </div>
        <div className="barber-list-tags">
          {tags.map((c) => c && <span key={c.id} className="tag-pill">{c.name}</span>)}
        </div>
        <div className="next-slot">
          <ClockIcon size={12} /> رزرو آنلاین فعال
        </div>
      </div>
      <div className="barber-list-side">
        <span className="barber-list-price">{barber.experience}</span>
        <button className="barber-list-btn">رزرو نوبت</button>
      </div>
    </div>
  );
}
