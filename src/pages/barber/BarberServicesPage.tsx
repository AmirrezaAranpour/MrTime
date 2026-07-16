import { useEffect, useState } from 'react';
import { servicesApi, type ServiceInput } from '@/api';
import type { Service } from '@/types/api';
import { useToast } from '@/context/ToastContext';
import { formatPrice, toPersianNum } from '@/lib/format';
import { BriefcaseIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';

interface FormState {
  id: number | null;
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true };

export default function BarberServicesPage() {
  const showToast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    servicesApi
      .list()
      .then((list) => setServices(list))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'خطا در دریافت خدمات'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => setForm({ ...EMPTY_FORM });
  const openEdit = (s: Service) =>
    setForm({
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      price: String(parseFloat(s.price)),
      duration_minutes: String(s.duration_minutes),
      is_active: s.is_active,
    });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return showToast('نام خدمت را وارد کنید');
    const price = Number(form.price);
    const duration = Number(form.duration_minutes);
    if (!(price > 0)) return showToast('قیمت باید بزرگ‌تر از صفر باشد');
    if (!(duration > 0)) return showToast('مدت زمان باید بزرگ‌تر از صفر باشد');

    const payload: ServiceInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: price.toFixed(2),
      duration_minutes: duration,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (form.id) await servicesApi.update(form.id, payload);
      else await servicesApi.create(payload);
      showToast(form.id ? 'خدمت ویرایش شد' : 'خدمت اضافه شد');
      setForm(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ذخیره خدمت');
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    if (!confirm(`حذف خدمت «${s.name}»؟`)) return;
    try {
      await servicesApi.remove(s.id);
      showToast('خدمت حذف شد');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'حذف ممکن نیست');
    }
  }

  return (
    <>
      <div className="dash-head">
        <h1>خدمات من</h1>
        <p>خدمات قابل رزرو خود را مدیریت کنید</p>
      </div>

      {error && <div className="inline-error">{error}</div>}

      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <h2>لیست خدمات</h2>
            <p>{toPersianNum(services.length)} خدمت ثبت شده</p>
          </div>
          {!form && (
            <button className="btn-primary btn-sm" onClick={openCreate}>
              <PlusIcon size={16} /> افزودن خدمت
            </button>
          )}
        </div>

        {form && (
          <form className="dash-card" style={{ background: 'var(--surface-alt)', marginBottom: 18 }} onSubmit={save}>
            <h2 style={{ fontSize: 16, marginBottom: 14 }}>{form.id ? 'ویرایش خدمت' : 'خدمت جدید'}</h2>
            <div className="dash-form-grid">
              <div className="form-field">
                <label>نام خدمت</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: اصلاح مو کلاسیک" />
              </div>
              <div className="form-field">
                <label>مدت زمان (دقیقه)</label>
                <input
                  type="number"
                  min={1}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="form-field">
                <label>قیمت (تومان)</label>
                <input
                  type="number"
                  min={0}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <div className="form-field">
                <label>وضعیت</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, paddingTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  فعال (قابل رزرو)
                </label>
              </div>
              <div className="form-field full">
                <label>توضیحات</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="توضیح کوتاه درباره خدمت..."
                />
              </div>
            </div>
            <div className="dash-form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : form.id ? 'ذخیره تغییرات' : 'افزودن خدمت'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
                انصراف
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="page-loader">
            <span className="spinner dark" /> در حال بارگذاری…
          </div>
        ) : services.length ? (
          <div className="dash-list">
            {services.map((s) => (
              <div key={s.id} className={`dash-row ${s.is_active ? '' : 'inactive'}`}>
                <div className="dash-row-main">
                  <h3>
                    {s.name}
                    {!s.is_active && <span className="badge-pill gray">غیرفعال</span>}
                  </h3>
                  <p>
                    {s.description || 'بدون توضیحات'} · {toPersianNum(s.duration_minutes)} دقیقه
                  </p>
                </div>
                <div className="dash-row-side">
                  <span className="dash-row-price">{formatPrice(s.price)}</span>
                  <button className="icon-action" onClick={() => openEdit(s)} aria-label="ویرایش">
                    <PencilIcon size={16} />
                  </button>
                  <button className="icon-action danger" onClick={() => remove(s)} aria-label="حذف">
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-empty">
            <BriefcaseIcon size={48} strokeWidth={1.5} />
            <h3>هنوز خدمتی ثبت نکرده‌اید</h3>
            <p>برای شروع، اولین خدمت خود را اضافه کنید.</p>
          </div>
        )}
      </div>
    </>
  );
}
