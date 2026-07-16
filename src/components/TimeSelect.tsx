import { TIME_OPTIONS } from '@/lib/timeGrid';
import { ChevronDownIcon } from '@/components/icons';

/** A 30-minute-grid time dropdown, styled to match the availability editors. */
export default function TimeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{
          width: '100%', padding: '10px 13px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
          border: '1px solid #e6e6e3', borderRadius: 10, background: '#fff', color: '#1c211d', textAlign: 'right',
          cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        }}
      >
        {TIME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#b0b0aa', display: 'flex' }}>
        <ChevronDownIcon size={17} />
      </span>
    </div>
  );
}
