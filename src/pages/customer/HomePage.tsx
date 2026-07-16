import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveBarbers } from '@/hooks/useActiveBarbers';
import { CATEGORIES, decorateBarber } from '@/lib/demo';
import { toPersianNum } from '@/lib/format';

// ── Material Symbol icon helper ──────────────────────────────────────────────
function Ms({ icon, filled = false, size = 20 }: { icon: string; filled?: boolean; size?: number }) {
  return (
    <span
      className={filled ? 'ms ms-filled' : 'ms'}
      style={{ fontSize: size } as CSSProperties}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

// ── Static demo data ─────────────────────────────────────────────────────────
const HERO_STATS = [
  { value: '+۸۰۰', label: 'آرایشگر فعال' },
  { value: '+۵۰هزار', label: 'نوبت موفق' },
  { value: '۴٫۹', label: 'رضایت کاربران' },
];

const CAT_META: Record<string, { bg: string; color: string; icon: string; count: string }> = {
  haircut: { bg: '#F0FAF4', color: '#22A45C', icon: 'content_cut', count: '۱۲۴ آرایشگر' },
  beard: { bg: '#EEF2F8', color: '#3B6FB0', icon: 'face', count: '۹۸ آرایشگر' },
  color: { bg: '#F8EEF4', color: '#A8478A', icon: 'palette', count: '۷۶ آرایشگر' },
  kids: { bg: '#F3EEF8', color: '#7A52B3', icon: 'child_care', count: '۵۲ آرایشگر' },
  package: { bg: '#FBF3E8', color: '#B9791F', icon: 'redeem', count: '۴۱ آرایشگر' },
  styling: { bg: '#EEF8F6', color: '#178A7A', icon: 'style', count: '۶۷ آرایشگر' },
};

const SLOT_TIMES = ['۱۷:۳۰', '۱۸:۰۰', '۱۹:۱۵'];
const SHOP_TAGS = ['جدید', 'محبوب', 'تخفیف‌دار', 'پرطرفدار'];
const SHOP_DISTS = ['۱٫۲ کیلومتر', '۸۵۰ متر', '۲٫۱ کیلومتر', '۱٫۷ کیلومتر'];

const OFFERS = [
  {
    dark: true, eyebrow: 'پیشنهاد ویژه', title: '۳۰٪ تخفیف اولین رزرو',
    sub: 'برای کاربران جدید مسترتایم', cta: 'دریافت کد',
  },
  {
    dark: false, eyebrow: 'پکیج داماد', title: 'کوتاهی + اصلاح + حالت‌دهی',
    sub: 'با ۲۰٪ تخفیف مجموعه', cta: 'مشاهده',
  },
];

const LOYALTY_STAMPS = [
  { done: true }, { done: true }, { done: true }, { done: true }, { done: false },
];

const THREE_STEPS = [
  { icon: 'search', title: 'آرایشگر مورد نظرت رو پیدا کن' },
  { icon: 'event_available', title: 'وقت خالی رو انتخاب و رزرو کن' },
  { icon: 'check_circle', title: 'سر وقت برو، لذت ببر' },
];

const TESTIMONIALS = [
  { initial: 'م', bg: '#F0FAF4', color: '#22A45C', name: 'محمد ر.', text: 'رزرو خیلی سریع و راحت بود، دیگه لازم نیست زنگ بزنم و منتظر بمونم.' },
  { initial: 'س', bg: '#EEF2F8', color: '#3B6FB0', name: 'سینا ا.', text: 'نمونه‌کارها و نظرها کمک کرد بهترین آرایشگر محله رو پیدا کنم.' },
  { initial: 'پ', bg: '#F8EEF4', color: '#A8478A', name: 'پارسا ن.', text: 'یادآوری نوبت عالیه، دیگه هیچ وقتی رو از دست نمی‌دم.' },
];

const FOOTER_LINKS = ['درباره ما', 'تماس با ما', 'قوانین و مقررات', 'برای آرایشگران'];
const FOOTER_SUPPORT = ['سوالات متداول', 'راهنمای رزرو', 'حریم خصوصی'];

function neighborhood(address: string) {
  return address.split('،')[1]?.trim() ?? address;
}
function priceFrom(reviews: number) {
  return toPersianNum((reviews * 500 + 80000).toLocaleString());
}

// ── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { barbers, loading } = useActiveBarbers();
  const [query, setQuery] = useState('');

  const decorated = barbers.map(decorateBarber);
  const featured = decorated.filter((b) => b.featured);
  const topBarbers = (featured.length >= 4 ? featured : decorated).slice(0, 4);
  const quickSlots = topBarbers.slice(0, 3).map((b, i) => ({ ...b, slot: SLOT_TIMES[i] }));
  const shops = decorated.slice(0, 4);

  const search = (q = query) => navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && search();
  const goCategory = (id: string) => navigate(`/search?category=${id}`);

  return (
    <div className="page active hp-page">
      <div className="container">

        {/* ── HERO ── */}
        <section className="hp-hero">
          <div className="hp-hero-content">
            <div className="hp-hero-badge">
              <Ms icon="bolt" filled size={15} />
              رزرو آنلاین در کمتر از یک دقیقه
            </div>
            <h1 className="hp-hero-title">
              نوبت آرایشگاهت رو<br />
              <span className="hp-accent">آنلاین</span> رزرو کن
            </h1>
            <p className="hp-hero-desc">
              بهترین آرایشگرهای شهرت رو پیدا کن، نمونه‌کار و نظرها رو ببین، و وقت خالی رو همون لحظه رزرو کن.
            </p>

            <div className="hp-search">
              <div className="hp-search-seg hp-search-loc">
                <Ms icon="location_on" size={20} />
                <div>
                  <div className="hp-search-seg-label">موقعیت</div>
                  <div className="hp-search-seg-val">سعادت‌آباد</div>
                </div>
              </div>
              <div className="hp-search-divider" />
              <div className="hp-search-seg hp-search-field">
                <Ms icon="search" size={19} />
                <input
                  type="search"
                  placeholder="نام آرایشگر یا خدمت…"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onEnter}
                />
              </div>
              <button className="hp-search-btn" onClick={() => search()}>
                <Ms icon="search" size={18} />
                جستجو
              </button>
            </div>

            <div className="hp-hero-stats">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="hp-stat">
                  <div className="hp-stat-val">{s.value}</div>
                  <div className="hp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-hero-visual">
            <div className="hp-hero-blob hp-hero-blob-1" />
            <div className="hp-hero-blob hp-hero-blob-2" />
            <div className="hp-hero-float">
              <div className="hp-hero-photo">
                <span className="hp-hero-photo-tag">عکس فضای آرایشگاه</span>
              </div>
              <div className="hp-hero-card">
                <div className="hp-hero-card-info">
                  <div className="hp-hero-card-avatar">آ</div>
                  <div>
                    <div className="hp-hero-card-name">استاد آرش</div>
                    <div className="hp-hero-card-meta">۱٫۲ کیلومتر · باز است</div>
                  </div>
                </div>
                <span className="hp-hero-card-rating">
                  <Ms icon="star" filled size={14} />
                  ۴٫۹
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICE CATEGORIES ── */}
        <section className="hp-section">
          <div className="hp-section-head">
            <h2 className="hp-section-title">دسته‌بندی خدمات</h2>
            <a className="hp-section-link" onClick={() => navigate('/search')}>مشاهده همه ←</a>
          </div>
          <div className="hp-cats">
            {CATEGORIES.map((c) => {
              const m = CAT_META[c.id] ?? CAT_META.haircut;
              return (
                <button key={c.id} className="hp-cat-card" onClick={() => goCategory(c.id)}>
                  <div className="hp-cat-icon" style={{ background: m.bg, color: m.color } as CSSProperties}>
                    <Ms icon={m.icon} filled size={23} />
                  </div>
                  <div className="hp-cat-name">{c.name}</div>
                  <div className="hp-cat-count">{m.count}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── QUICK BOOK TODAY ── */}
        <section className="hp-section">
          <div className="hp-section-head hp-section-head-icon">
            <div className="hp-section-icon">
              <Ms icon="bolt" filled size={22} />
            </div>
            <div>
              <h2 className="hp-section-title">رزرو سریع برای همین امروز</h2>
              <p className="hp-section-sub">نزدیک‌ترین وقت‌های خالی آرایشگران اطرافت</p>
            </div>
          </div>
          <div className="hp-quick">
            {quickSlots.map((q) => (
              <div key={q.id} className="hp-quick-card">
                <div className="hp-quick-avatar" style={{ background: q.color } as CSSProperties}>
                  {q.initial}
                </div>
                <div className="hp-quick-info">
                  <div className="hp-quick-name">{q.name}</div>
                  <div className="hp-quick-loc">
                    <Ms icon="location_on" size={13} />
                    {neighborhood(q.address)}
                  </div>
                </div>
                <button className="hp-quick-btn" onClick={() => navigate(`/barber/${q.id}`)}>
                  <span className="hp-quick-time">{q.slot}</span>
                  <span className="hp-quick-today">امروز</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEARBY SHOPS ── */}
        <section className="hp-section">
          <div className="hp-section-head">
            <h2 className="hp-section-title">آرایشگاه‌های نزدیک تو</h2>
            <a className="hp-section-link" onClick={() => navigate('/search')}>روی نقشه ←</a>
          </div>
          <div className="hp-shops">
            {shops.map((s, i) => (
              <div key={s.id} className="hp-shop-card" onClick={() => navigate(`/barber/${s.id}`)}>
                <div className="hp-shop-cover">
                  <span className="hp-shop-tag">{SHOP_TAGS[i % SHOP_TAGS.length]}</span>
                </div>
                <div className="hp-shop-body">
                  <div className="hp-shop-top">
                    <div className="hp-shop-name">{s.salon}</div>
                    <span className="hp-shop-rating">
                      <Ms icon="star" filled size={13} />
                      {toPersianNum(s.rating.toFixed(1))}
                    </span>
                  </div>
                  <div className="hp-shop-area">
                    {neighborhood(s.address)} · {SHOP_DISTS[i % SHOP_DISTS.length]}
                  </div>
                  <div className="hp-shop-foot">
                    <span className="hp-shop-price">از {priceFrom(s.reviews)} تومان</span>
                    <button
                      className="hp-shop-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/barber/${s.id}`); }}
                    >
                      رزرو
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TOP BARBERS ── */}
        <section className="hp-section">
          <div className="hp-section-head">
            <h2 className="hp-section-title">آرایشگران برتر</h2>
            <a className="hp-section-link" onClick={() => navigate('/search')}>همه استادها ←</a>
          </div>
          {loading ? (
            <div className="page-loader"><span className="spinner dark" /> در حال بارگذاری…</div>
          ) : (
            <div className="hp-barbers">
              {topBarbers.map((b) => (
                <div key={b.id} className="hp-barber-card" onClick={() => navigate(`/barber/${b.id}`)}>
                  <div className="hp-barber-cover">
                    <div className="hp-barber-avatar" style={{ background: b.color } as CSSProperties}>
                      {b.initial}
                    </div>
                    <div className="hp-barber-rating">
                      <Ms icon="star" filled size={12} />
                      {toPersianNum(b.rating.toFixed(1))}
                    </div>
                    <div className="hp-barber-open">
                      <span className="hp-barber-open-dot" />
                      باز است
                    </div>
                  </div>
                  <div className="hp-barber-body">
                    <div className="hp-barber-name-row">
                      <span className="hp-barber-name">{b.name}</span>
                      <Ms icon="verified" filled size={15} />
                    </div>
                    <div className="hp-barber-specialty">{b.specialty}</div>
                    <div className="hp-barber-meta">
                      <span className="hp-barber-meta-item">
                        <Ms icon="location_on" size={14} />
                        {neighborhood(b.address)}
                      </span>
                      <span className="hp-barber-meta-item">
                        <Ms icon="reviews" size={14} />
                        {toPersianNum(b.reviews)} نظر
                      </span>
                    </div>
                    <div className="hp-barber-foot">
                      <div className="hp-barber-price">
                        <span className="hp-barber-price-from">از </span>
                        <span className="hp-barber-price-val">{priceFrom(b.reviews)}</span>
                        <span className="hp-barber-price-unit"> تومان</span>
                      </div>
                      <span className="hp-barber-book">
                        رزرو
                        <Ms icon="arrow_back" size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── OFFERS ── */}
        <section className="hp-section">
          <div className="hp-offers">
            {OFFERS.map((o) => (
              <div key={o.title} className={o.dark ? 'hp-offer hp-offer-dark' : 'hp-offer hp-offer-light'}>
                <div>
                  <div className="hp-offer-eyebrow">{o.eyebrow}</div>
                  <div className="hp-offer-title">{o.title}</div>
                  <div className="hp-offer-sub">{o.sub}</div>
                </div>
                <button className="hp-offer-btn">{o.cta}</button>
              </div>
            ))}
          </div>
        </section>

        {/* ── LOYALTY ── */}
        <section className="hp-loyalty">
          <div className="hp-loyalty-left">
            <span className="hp-loyalty-badge">
              <Ms icon="redeem" filled size={14} />
              باشگاه مشتریان
            </span>
            <h2 className="hp-loyalty-title">هر ۵ نوبت، یکی مهمون ما</h2>
            <p className="hp-loyalty-desc">
              با هر رزرو یک مهر روی کارتت می‌زنیم؛ کارتت که پر شد، نوبت بعدی مهمون مسترتایمه.
            </p>
            <div className="hp-loyalty-progress">
              <div className="hp-loyalty-track">
                <div className="hp-loyalty-fill" style={{ width: '80%' } as CSSProperties} />
              </div>
              <span className="hp-loyalty-count">۴ از ۵</span>
            </div>
          </div>
          <div className="hp-loyalty-right">
            <div className="hp-loyalty-stamps-wrap">
              <div className="hp-loyalty-stamps-line" />
              <div className="hp-loyalty-stamps">
                {LOYALTY_STAMPS.map((s, i) => (
                  <div key={i} className={s.done ? 'hp-loyalty-stamp hp-loyalty-stamp-done' : 'hp-loyalty-stamp hp-loyalty-stamp-todo'}>
                    <Ms icon={s.done ? 'check' : 'redeem'} filled size={24} />
                  </div>
                ))}
              </div>
            </div>
            <span className="hp-loyalty-chip">۱ نوبت مانده تا هدیه</span>
          </div>
        </section>

        {/* ── 3 STEPS ── */}
        <section className="hp-steps">
          <h2 className="hp-steps-title">سه قدم تا نوبتِ راحت</h2>
          <div className="hp-steps-grid">
            {THREE_STEPS.map((st) => (
              <div key={st.title} className="hp-step">
                <div className="hp-step-circle">
                  <Ms icon={st.icon} size={38} />
                  <span className="hp-step-check">
                    <Ms icon="check" filled size={14} />
                  </span>
                </div>
                <div className="hp-step-title">{st.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="hp-section">
          <div className="hp-reviews-head">
            <h2 className="hp-section-title">مشتری‌ها چه می‌گویند</h2>
            <p className="hp-section-sub">هزاران رزرو موفق هر ماه در مسترتایم</p>
          </div>
          <div className="hp-reviews">
            {TESTIMONIALS.map((r) => (
              <div key={r.name} className="hp-review-card">
                <div className="hp-review-stars">
                  {[1, 2, 3, 4, 5].map((i) => <Ms key={i} icon="star" filled size={14} />)}
                </div>
                <p className="hp-review-text">«{r.text}»</p>
                <div className="hp-review-author">
                  <div className="hp-review-avatar" style={{ background: r.bg, color: r.color } as CSSProperties}>
                    {r.initial}
                  </div>
                  <span className="hp-review-name">{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BARBER CTA ── */}
        <section className="hp-cta">
          <div className="hp-cta-blob" />
          <div className="hp-cta-inner">
            <div className="hp-cta-badge">
              <Ms icon="store" size={15} />
              ویژه آرایشگران
            </div>
            <h2 className="hp-cta-title">نوبت‌هات را هوشمند مدیریت کن</h2>
            <p className="hp-cta-desc">پنل اختصاصی مدیریت نوبت و جذب مشتری، همه در مسترتایم.</p>
            <button className="hp-cta-btn" onClick={() => navigate('/barber-panel/login')}>
              <Ms icon="add_business" size={20} />
              ثبت آرایشگاه
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="hp-footer">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <div className="hp-footer-logo-row">
                <div className="hp-footer-logo">
                  <Ms icon="content_cut" filled size={17} />
                </div>
                <span className="hp-footer-brand-name">مسترتایم</span>
              </div>
              <p className="hp-footer-desc">
                رزرو آنلاین نوبت آرایشگر، سریع، آسان و بدون انتظار — همه‌جا در دسترس شما.
              </p>
            </div>
            <div className="hp-footer-col">
              <div className="hp-footer-col-title">لینک‌های مفید</div>
              <div className="hp-footer-links">
                {FOOTER_LINKS.map((l) => <a key={l}>{l}</a>)}
              </div>
            </div>
            <div className="hp-footer-col">
              <div className="hp-footer-col-title">پشتیبانی</div>
              <div className="hp-footer-links">
                {FOOTER_SUPPORT.map((l) => <a key={l}>{l}</a>)}
              </div>
            </div>
            <div className="hp-footer-col">
              <div className="hp-footer-col-title">اطلاعات تماس</div>
              <div className="hp-footer-contact">
                <div className="hp-footer-contact-item">
                  <Ms icon="call" size={16} />
                  <span dir="ltr">۰۲۱-۹۱۰۵۰۰۰۰</span>
                </div>
                <div className="hp-footer-contact-item">
                  <Ms icon="mail" size={16} />
                  <span dir="ltr">support@mrtime.ir</span>
                </div>
                <div className="hp-footer-contact-item">
                  <Ms icon="location_on" size={16} />
                  تهران، سعادت‌آباد، بلوار سرو
                </div>
              </div>
            </div>
          </div>
          <div className="hp-footer-divider" />
          <div className="hp-footer-bottom">
            <div>© ۱۴۰۴ مسترتایم — تمامی حقوق محفوظ است.</div>
            <div className="hp-footer-social">
              <span className="hp-footer-social-icon"><Ms icon="photo_camera" size={16} /></span>
              <span className="hp-footer-social-icon"><Ms icon="send" size={16} /></span>
              <span className="hp-footer-social-icon"><Ms icon="smart_display" size={16} /></span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
