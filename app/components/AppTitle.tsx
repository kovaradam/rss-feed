import React from 'react';

export function AppTitleEmitter(props: { children: string }) {
  const elementRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    elementRef.current?.dispatchEvent(
      new CustomEvent('app-title', {
        bubbles: true,
        detail: { title: props.children },
      })
    );
  }, [props.children]);

  return <div style={{ display: 'none' }} ref={elementRef}></div>;
}

export function AppTitleClient(props: { defaultTitle: string }) {
  const [title, setTitle] = React.useState(props.defaultTitle);
  const titleEventHandler: EventListenerOrEventListenerObject = (event) => {
    setTitle((event as Event & { detail: { title: string } }).detail.title);
  };
  React.useEffect(() => {
    window.addEventListener('app-title', titleEventHandler);
    return () => {
      window.removeEventListener('app-title', titleEventHandler);
    };
  }, []);

  return <>{title}</>;
}
