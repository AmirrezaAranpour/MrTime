import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActiveBarbers } from '@/hooks/useActiveBarbers';
import { CATEGORIES, categoryById } from '@/lib/demo';
import { toPersianNum } from '@/lib/format';
import BarberListItem from '@/components/BarberListItem';
import { ChevronRightIcon, SearchIcon } from '@/components/icons';

export default function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { barbers, loading, error } = useActiveBarbers();

  const category = params.get('category');
  const urlQuery = params.get('q') ?? '';
  const [term, setTerm] = useState(urlQuery);

  const activeCategory = category ? categoryById(category) : undefined;
  const effectiveQuery = (term || urlQuery).trim();

  const results = useMemo(() => {
    let list = barbers;
    if (category) list = list.filter((b) => b.categories.includes(category));
    if (effectiveQuery) {
      const q = effectiveQuery;
      list = list.filter(
        (b) => b.name.includes(q) || b.salon.includes(q) || b.specialty.includes(q),
      );
    }
    return list;
  }, [barbers, category, effectiveQuery]);

  const setCategory = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('category', id);
    else next.delete('category');
    setParams(next);
  };

  const title = activeCategory?.name ?? (urlQuery ? 'نتایج جستجو' : 'همه آرایشگران');
  const subtitle = activeCategory ? `آرایشگران متخصص ${activeCategory.name}` : 'بهترین آرایشگران نزدیک شما';

  return (
    <section className="page active">
      <div className="page-banner">
        <div className="container">
          <div className="page-banner-inner">
            <button className="btn-back" onClick={() => navigate('/')}>
              <ChevronRightIcon size={20} />
            </button>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-body">
        <div className="search-toolbar">
          <div className="search-field">
            <SearchIcon className="field-icon" size={18} />
            <input
              type="search"
              placeholder="جستجوی آرایشگر، سالن یا تخصص..."
              autoComplete="off"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory(null)}>
              همه
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <span className="spinner dark" /> در حال بارگذاری آرایشگران…
          </div>
        ) : error ? (
          <div className="inline-error">{error}</div>
        ) : (
          <>
            <div className="results-count">{toPersianNum(results.length)} آرایشگر یافت شد</div>
            {results.length ? (
              <div className="barbers-list">
                {results.map((b) => (
                  <BarberListItem key={b.id} barber={b} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration">
                  <SearchIcon size={64} strokeWidth={1.5} />
                </div>
                <h3>آرایشگری یافت نشد</h3>
                <p>عبارت جستجو یا فیلتر را تغییر دهید</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
