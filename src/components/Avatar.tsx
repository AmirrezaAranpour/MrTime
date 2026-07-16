import type { CSSProperties } from 'react';

interface Props {
  initial: string;
  color: string;
  size?: '' | 'avatar-lg' | 'avatar-xl';
}

export default function Avatar({ initial, color, size = '' }: Props) {
  return (
    <div className={`avatar ${size}`.trim()} style={{ '--av-color': color } as CSSProperties}>
      {initial}
    </div>
  );
}
