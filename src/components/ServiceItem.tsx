import { formatPrice, toPersianNum } from '@/lib/format';

export interface ServiceItemData {
  id: number;
  name: string;
  description: string;
  price: string | number;
  duration_minutes: number;
}

interface Props {
  service: ServiceItemData;
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export default function ServiceItem({ service, selected = false, onSelect }: Props) {
  return (
    <div
      className={`service-item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect?.(service.id)}
      role={onSelect ? 'button' : undefined}
    >
      <div className="service-radio" />
      <div className="service-info">
        <h4>{service.name}</h4>
        <p>
          {service.description ? `${service.description} · ` : ''}
          {toPersianNum(service.duration_minutes)} دقیقه
        </p>
      </div>
      <div className="service-price">
        <strong>{formatPrice(service.price)}</strong>
      </div>
    </div>
  );
}
