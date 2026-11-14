import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render } from '@testing-library/react';
import { Cenefa } from '../Cenefa';

describe('Cenefa', () => {
  test('is purely decorative: hidden from assistive technology and never focusable', () => {
    const { container } = render(<Cenefa />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(container.querySelector('a, button, input, [tabindex]')).toBeNull();
  });

  test('paints the tile pattern across the whole band', () => {
    const { container } = render(<Cenefa />);
    const patron = container.querySelector('pattern');
    const franja = container.querySelector('rect[data-cenefa-franja]');

    expect(patron).not.toBeNull();
    expect(franja).toHaveAttribute('fill', `url(#${patron?.id})`);
  });

  test('two bands on one page never share a pattern id', () => {
    const { container } = render(
      <>
        <Cenefa />
        <Cenefa />
      </>
    );
    const ids = Array.from(container.querySelectorAll('pattern')).map((p) => p.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    // `url(#id)` must stay valid: no colons from React's generated ids.
    ids.forEach((id) => expect(id).toMatch(/^[A-Za-z0-9_-]+$/));
  });

  test('the height comes from the class the caller passes in', () => {
    const { container } = render(<Cenefa className="h-10" />);

    expect(container.querySelector('svg')).toHaveClass('h-10');
  });
});
