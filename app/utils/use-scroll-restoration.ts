import React, { useDeferredValue } from "react";
import { useNavigation, useLocation } from "react-router";

const positionMap = new Map<string, number>();

export function useScrollRestoration() {
  const { pathname } = useLocation();
  const navigation = useNavigation();

  React.useEffect(() => {
    // If there's a navigation to the next location, store current scroll on unmount
    if (navigation.location?.pathname) {
      const { scrollTop } = document.body;
      return () => {
        positionMap.set(pathname, scrollTop);
      };
    }
  }, [pathname, navigation.location?.pathname]);

  const deferredPathname = useDeferredValue(pathname);

  React.useLayoutEffect(() => {
    // scroll to top on pathname change
    document.body.scrollTo({ top: 0 });
  }, [pathname]);

  React.useLayoutEffect(() => {
    // when transition ended (signalled by deferred pathname change), try to restore
    if (restorePosition) {
      document.body.scrollTo({ top: restorePosition });
      restorePosition = null;
    }
  }, [deferredPathname]);
}

let restorePosition: number | null = null;

if (globalThis.document) {
  const listener = () => {
    const pathname = window.location.pathname;
    restorePosition = positionMap.get(pathname) ?? null;
  };
  window.addEventListener("popstate", listener);
}
