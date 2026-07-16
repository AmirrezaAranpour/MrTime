import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { barbersApi } from '@/api';
import type { BarberDetail, PublicService } from '@/types/api';
import { decorateBarber, reviewsFor, type DemoReview } from '@/lib/demo';
import { formatPrice, parsePrice, toPersianNum } from '@/lib/format';
import Stars from '@/components/Stars';
import Header from '@/components/Header';
import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  InstagramIcon,
  MapPinIcon,
  PhoneIcon,
  ScissorsIcon,
  ShieldIcon,
} from '@/components/icons';

const DEMO_BIO =
  'با سال‌ها تجربه در اصلاح مو و ریش مردانه، تخصص اصلی من فیدهای مدرن، اصلاح کلاسیک و طراحی ریش است. هدفم ارائه بهترین حس و ظاهر به هر مشتری در فضایی آرام و حرفه‌ای است. هر نوبت با یک مشاوره کوتاه برای انتخاب بهترین مدل آغاز می‌شود.';

const DEMO_TAGS = ['اصلاح مو', 'اصلاح ریش', 'مدل‌های مدرن'];

const RATING_BARS = [
  { star: '۵', pct: '72%' },
  { star: '۴', pct: '18%' },
  { star: '۳', pct: '6%' },
  { star: '۲', pct: '2%' },
  { star: '۱', pct: '2%' },
];

const NAV_TABS = [
  { id: 'about', label: 'درباره' },
  { id: 'services', label: 'خدمات' },
  { id: 'reviews', label: 'نظرات' },
  { id: 'location', label: 'موقعیت' },
];

export default function BarberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const barberId = Number(id);
  const navigate = useNavigate();

  const [barber, setBarber] = useState<BarberDetail | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('about');

  const aboutRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const reviewsRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!barberId || isNaN(barberId)) {
      navigate('/search');
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([barbersApi.getBarber(barberId), barbersApi.publicServices(barberId)])
      .then(([b, s]) => {
        if (!active) return;
        setBarber(b);
        setServices(s);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [barberId, navigate]);

  const demo = barber ? decorateBarber({ id: barber.id, name: barber.name }) : null;
  const reviews = reviewsFor(barberId);
  const color = demo?.color ?? '#22A45C';
  const initial = demo?.initial ?? '؟';

  const minPrice = services.length ? Math.min(...services.map((s) => parsePrice(s.price))) : 0;

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    if (sectionId === 'about') aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (sectionId === 'services') servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (sectionId === 'reviews') reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (sectionId === 'location') locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startBooking() {
    if (selectedId) navigate(`/booking/${barberId}?service=${selectedId}`);
    else navigate(`/booking/${barberId}`);
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="bp-page" dir="rtl">
          <div className="bp-scroller" style={{ paddingTop: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="spinner dark" />
          </div>
        </div>
      </>
    );
  }

  if (!barber) {
    return (
      <>
        <Header />
        <div className="bp-page" dir="rtl">
          <div className="bp-scroller" style={{ paddingTop: 'var(--header-h)' }}>
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ marginBottom: 16, color: '#8a958e' }}>آرایشگر یافت نشد</p>
              <button className="btn-primary" onClick={() => navigate('/search')}>
                بازگشت به جستجو
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const specialty = barber.specialty || (demo?.specialty ?? '');
  const address = barber.address || (demo?.address ?? '');
  const experience = barber.experience_years
    ? `${toPersianNum(String(barber.experience_years))} سال`
    : (demo?.experience ?? '');
  const bio = barber.bio || DEMO_BIO;
  const specialtyTags = specialty
    ? specialty
        .split('،')
        .map((t) => t.trim())
        .filter(Boolean)
    : DEMO_TAGS;

  return (
    <>
      <Header />
      <div className="bp-page" dir="rtl">
        <div className="bp-scroller" style={{ paddingTop: 'var(--header-h)' }}>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 16px 120px' }}>
          {/* ── HERO ── */}
          <section className="bp-section" style={{ marginBottom: 14 }}>
            {/* Cover */}
            <div className="bp-hero-cover" style={{ background: '#1ca85a' }}>
              <div className="bp-hero-cover-dots" />
              <div className="bp-verified-badge">
                <ShieldIcon size={12} />
                <span>آرایشگر تاییدشده</span>
              </div>
            </div>

            {/* Hero body */}
            <div className="bp-hero-body">
              {/* Avatar */}
              <div className="bp-avatar-circle" style={{ '--av-color': color } as CSSProperties}>
                {initial}
              </div>

              {/* Name + meta */}
              <div style={{ flex: '1 1 260px', minWidth: 210, paddingBottom: 2 }}>
                <div className="bp-name-row">
                  <h1>{barber.name}</h1>
                  {demo && (
                    <span className="bp-rating-pill">
                      ★ {toPersianNum(demo.rating.toFixed(1))}
                      <span style={{ fontWeight: 400, color: '#7fae93' }}>
                        ({toPersianNum(String(demo.reviews))})
                      </span>
                    </span>
                  )}
                </div>
                <div className="bp-meta-row">
                  {specialty && (
                    <span className="bp-meta-item">
                      <ScissorsIcon size={15} style={{ color }} />
                      {specialty}
                    </span>
                  )}
                  {address && (
                    <span className="bp-meta-item">
                      <MapPinIcon size={15} />
                      {address}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bp-hero-actions">
                {barber.phone && (
                  <a
                    href={`tel:${barber.phone}`}
                    className="bp-icon-btn"
                    style={{ width: 50, height: 48, borderRadius: 13, textDecoration: 'none' }}
                    aria-label="تماس"
                  >
                    <PhoneIcon size={20} />
                  </a>
                )}
                <button
                  className="btn-primary"
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onClick={startBooking}
                >
                  <CalendarIcon size={18} />
                  رزرو نوبت
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="bp-stats">
              <StatItem value={toPersianNum(String(services.length))} label="خدمت" />
              <StatItem value={experience || '—'} label="تجربه" />
              <StatItem value={toPersianNum(String(demo?.reviews ?? 0))} label="مشتری" />
              <StatItem value={toPersianNum((demo?.rating ?? 4.8).toFixed(1))} label="امتیاز" />
            </div>
          </section>

          {/* ── SECTION NAV ── */}
          <div className="bp-nav-wrap">
            <div className="bp-nav-scroll">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`bp-tab${activeSection === tab.id ? ' active' : ''}`}
                  onClick={() => scrollToSection(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── ABOUT ── */}
          <section id="sec-about" ref={aboutRef} className="bp-section" style={{ scrollMarginTop: 130 }}>
            <div className="bp-section-inner">
              <div className="bp-section-title">
                <BriefcaseIcon size={18} style={{ color: '#1ca85a' }} />
                <h2>درباره آرایشگر</h2>
              </div>
              <p className="bp-bio">{bio}</p>
              <div className="bp-tags">
                {specialtyTags.map((t) => (
                  <span key={t} className="bp-tag">
                    ✓ {t}
                  </span>
                ))}
              </div>
              <div className="bp-highlights">
                <HighlightCard
                  icon={<BriefcaseIcon size={18} />}
                  value={experience || '—'}
                  sub="سابقه کاری"
                />
                <HighlightCard
                  icon={<ScissorsIcon size={18} />}
                  value={`${toPersianNum(String(services.length))} خدمت`}
                  sub="خدمات ارائه‌شده"
                />
                <HighlightCard
                  icon={<ShieldIcon size={18} />}
                  value="تاییدشده"
                  sub="وضعیت حرفه‌ای"
                />
              </div>
            </div>
          </section>

          {/* ── SERVICES ── */}
          <section
            id="sec-services"
            ref={servicesRef}
            className="bp-section"
            style={{ scrollMarginTop: 130 }}
          >
            <div className="bp-section-inner">
              <div className="bp-section-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ScissorsIcon size={18} style={{ color: '#1ca85a' }} />
                  <h2>خدمات</h2>
                </div>
                <span style={{ fontSize: 12, color: '#8a958e' }}>
                  {toPersianNum(String(services.length))} خدمت
                </span>
              </div>
              {services.length === 0 ? (
                <p style={{ color: '#8a958e', fontSize: 14 }}>
                  این آرایشگر هنوز خدمتی ثبت نکرده است.
                </p>
              ) : (
                <div className="bp-service-grid">
                  {services.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      selected={selectedId === s.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── REVIEWS ── */}
          <section
            id="sec-reviews"
            ref={reviewsRef}
            className="bp-section"
            style={{ scrollMarginTop: 130 }}
          >
            <div className="bp-section-inner">
              <div className="bp-section-title">
                <span style={{ fontSize: 20, color: '#1ca85a', lineHeight: 1 }}>★</span>
                <h2>نظرات مشتریان</h2>
              </div>
              <div className="bp-reviews-summary">
                <div className="bp-rating-big">
                  <strong>{toPersianNum((demo?.rating ?? 4.8).toFixed(1))}</strong>
                  <div style={{ marginTop: 6 }}>
                    <Stars rating={demo?.rating ?? 4.8} />
                  </div>
                  <div className="bp-rating-count">
                    {toPersianNum(String(demo?.reviews ?? 0))} نظر
                  </div>
                </div>
                <div className="bp-rating-bars">
                  {RATING_BARS.map((b) => (
                    <RatingBar key={b.star} star={b.star} pct={b.pct} />
                  ))}
                </div>
              </div>
              <div className="bp-review-grid">
                {reviews.map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
              </div>
            </div>
          </section>

          {/* ── LOCATION ── */}
          <section
            id="sec-location"
            ref={locationRef}
            className="bp-section"
            style={{ scrollMarginTop: 130, marginBottom: 14 }}
          >
            <div className="bp-section-inner" style={{ paddingBottom: 16 }}>
              <div className="bp-section-title">
                <MapPinIcon size={18} style={{ color: '#1ca85a' }} />
                <h2>موقعیت</h2>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="bp-location-map">
              <div className="bp-location-grid" />
              <div className="bp-location-roads">
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: 0,
                    right: 0,
                    height: 14,
                    background: '#cfdbd2',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: '32%',
                    width: 14,
                    background: '#cfdbd2',
                  }}
                />
              </div>
              <div className="bp-location-pin">
                <MapPinIcon size={44} style={{ color: '#1ca85a' }} />
              </div>
            </div>
            {address && (
              <div className="bp-section-inner" style={{ paddingTop: 14, paddingBottom: 22 }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.95, color: '#52605a' }}>
                  {address}
                </p>
              </div>
            )}
          </section>

          {/* ── INSTAGRAM (optional) ── */}
          {barber.instagram_handle && (
            <section
              className="bp-section"
              style={{ background: color, border: 'none', marginBottom: 14, overflow: 'visible' }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '22px clamp(16px,4vw,26px)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    flexShrink: 0,
                    borderRadius: 15,
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <InstagramIcon size={26} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>اینستاگرام</div>
                  <div dir="ltr" style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
                    @{barber.instagram_handle}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── STICKY BOOK BAR ── */}
      <div className="bp-book-bar">
        <div className="bp-book-bar-inner">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#8a958e' }}>شروع از</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1ca85a', marginTop: 2 }}>
              {minPrice ? formatPrice(minPrice) : '—'}
            </div>
          </div>
          {demo && (
            <span className="bp-rating-pill" style={{ flexShrink: 0 }}>
              ★ {toPersianNum(demo.rating.toFixed(1))}
            </span>
          )}
          <button
            className="btn-primary"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={startBooking}
          >
            <CalendarIcon size={18} />
            رزرو نوبت
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// ── Sub-components ──

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="bp-stat-item">
      <div className="bp-stat-value">{value}</div>
      <div className="bp-stat-label">{label}</div>
    </div>
  );
}

function HighlightCard({ icon, value, sub }: { icon: ReactNode; value: string; sub: string }) {
  return (
    <div className="bp-highlight-card">
      <div className="bp-highlight-icon">{icon}</div>
      <div className="bp-highlight-text">
        <div className="bp-highlight-value">{value}</div>
        <div className="bp-highlight-sub">{sub}</div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: PublicService;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div
      className={`bp-service-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(service.id)}
    >
      <div className="bp-service-icon">
        <ScissorsIcon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="bp-service-name">{service.name}</div>
        <div className="bp-service-duration">
          <ClockIcon size={12} />
          {toPersianNum(String(service.duration_minutes))} دقیقه
        </div>
      </div>
      <div className="bp-service-price">
        <strong>{formatPrice(service.price)}</strong>
      </div>
    </div>
  );
}

function RatingBar({ star, pct }: { star: string; pct: string }) {
  return (
    <div className="bp-rating-bar">
      <span style={{ width: 10, textAlign: 'center', color: '#8a958e', fontSize: 11 }}>{star}</span>
      <div className="bp-rating-bar-track">
        <div className="bp-rating-bar-fill" style={{ width: pct }} />
      </div>
      <span style={{ fontSize: 10.5, color: '#a7b0aa', width: 30 }}>{pct}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: DemoReview }) {
  return (
    <div className="bp-review-card">
      <div className="bp-review-header">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: review.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {review.initial}
        </div>
        <div className="bp-review-author">
          <strong>{review.author}</strong>
          <span>{review.date}</span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Stars rating={review.rating} />
        </div>
      </div>
      <p className="bp-review-text">{review.text}</p>
    </div>
  );
}
