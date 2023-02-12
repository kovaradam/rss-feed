import React from 'react';

let isHydrating = true;

export function ClientOnly(props: React.PropsWithChildren<unknown>) {
  let [isHydrated, setIsHydrated] = React.useState(!isHydrating);

  React.useEffect(() => {
    isHydrating = false;
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  if (typeof props.children === 'function') {
    return props.children?.();
  }
  return props.children;
}
