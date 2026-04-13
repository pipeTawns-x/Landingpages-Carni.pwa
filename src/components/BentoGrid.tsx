import type { ReactNode } from 'react';

export interface BentoGridProps {
  items: ReactNode[];
  gap?: '1rem' | '1.5rem' | '2rem';
  columns: {
    mobile: 1;
    tablet: 2;
    desktop: 3 | 4;
  };
}

export function BentoGrid({ items, gap = '1.5rem', columns }: BentoGridProps): JSX.Element {
  return (
    <div
      className="tw-bento-grid"
      style={{
        ['--tw-grid-gap' as string]: gap,
        ['--tw-grid-mobile' as string]: columns.mobile,
        ['--tw-grid-tablet' as string]: columns.tablet,
        ['--tw-grid-desktop' as string]: columns.desktop
      }}
    >
      {items.map((item, index) => (
        <div className="tw-bento-grid__item" key={index}>
          {item}
        </div>
      ))}
    </div>
  );
}
