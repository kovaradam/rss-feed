import React from 'react';

export function UseAppTitle(props: { children: string }) {
  const { setTitle } = React.useContext(AppTitle.Context);
  React.useEffect(() => {
    setTitle?.(props.children);
  }, [setTitle, props.children]);
  return null;
}
export function AppTitle(props: { defaultTitle: string }) {
  const { title } = React.useContext(AppTitle.Context);
  return <>{title ?? props.defaultTitle}</>;
}

AppTitle.Context = React.createContext<{
  title?: string;
  setTitle?(title: string): void;
}>({});
