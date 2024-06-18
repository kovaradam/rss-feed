import React, { useEffect } from 'react';

type Position = {
  readonly x: 'left' | 'right' | 'left-box';
  readonly y: 'top' | 'bottom';
};

export function Tooltip(
  props: React.PropsWithChildren<{
    target?: HTMLElement;
    position?: Partial<Position>;
  }>
) {
  const id = React.useId();
  const elementRef = React.useRef<HTMLDivElement>(null);
  const positionTimeoutRef = React.useRef(-1);
  const [position, setPosition] = React.useState<Position | null>(null);
  const target = props.target ?? elementRef.current?.parentElement;

  const show = React.useCallback(() => {
    clearTimeout(positionTimeoutRef.current);
    if (!target) {
      return null;
    }
    const targetRect = target?.getBoundingClientRect();
    const targetCenter = {
      left: targetRect.left + (targetRect.right - targetRect.left) / 2,
      top: targetRect.top + (targetRect.bottom - targetRect.top) / 2,
    };

    positionTimeoutRef.current = window.setTimeout(
      () =>
        setPosition({
          x:
            props.position?.x ??
            (targetCenter.left / window.innerWidth > 0.5 ? 'left' : 'right'),
          y:
            props.position?.y ??
            (targetCenter.top / window.innerHeight > 0.5 ? 'top' : 'bottom'),
        }),
      500
    );
  }, [target, props.position]);

  const hide = React.useCallback(() => {
    clearTimeout(positionTimeoutRef.current);
    setPosition(null);
  }, []);

  React.useEffect(() => {
    if (!target) {
      return;
    }
    target?.setAttribute('aria-describedby', id);

    target.addEventListener('mouseover', show);
    target.addEventListener('focus', show);
    target.addEventListener('blur', hide);
    target.addEventListener('mouseleave', hide);
    target.addEventListener('click', hide);

    return () => {
      target.removeEventListener('hover', show);
      target.removeEventListener('focus', show);
      target.removeEventListener('blur', hide);
      target.removeEventListener('mouseleave', hide);
      target.removeEventListener('click', hide);
    };
  }, [id, target, show, hide]);

  useEffect(() => {
    if (!position) {
      return;
    }

    function escapeHandler(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        hide();
      }
    }

    window.addEventListener('keydown', escapeHandler);
    return () => {
      window.removeEventListener('keydown', escapeHandler);
    };
  }, [position, hide]);

  return (
    <div
      className={`absolute z-50 ${
        position ? 'flex' : 'hidden'
      } items-center justify-center whitespace-nowrap rounded bg-slate-950 bg-opacity-90 p-2 text-white dark:border`}
      style={{
        left: {
          right: '100%',
          'left-box': 0,
          left: 'auto',
        }[position?.x ?? 'left'],
        right: position?.x === 'left' ? '100%' : 'auto',
        top: position?.y === 'bottom' ? '100%' : 'auto',
        bottom: position?.y === 'top' ? '100%' : 'auto',
      }}
      id={id}
      ref={elementRef}
    >
      {target?.getAttribute('aria-label') ?? props.children}
    </div>
  );
}
