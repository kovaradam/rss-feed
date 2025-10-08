import React from "react";

/**
 * Updates scroll position by the value the anchor element has moved between renders
 * if the change was caused by the change of reactive value provided
 */
export function usePreserveScroll(
  anchorRef: HTMLElement | null,
  reactiveValue: React.DependencyList,
  skip?: boolean,
) {
  const prevAnchorPosition = anchorRef?.offsetTop;

  const preserveScrollPosition = React.useEffectEvent(() => {
    if (
      skip
      // ||
      // (window.matchMedia("(max-width: 640px)").matches &&
      //   document.body.style.overflowAnchor !== undefined)
    ) {
      return;
    }

    const nextAnchorPosition = anchorRef?.offsetTop;

    // document.scrollingElement does not work for some reason
    const scrollingElement = document.body;

    if (scrollingElement && prevAnchorPosition && nextAnchorPosition) {
      const scrollPositionDiff = nextAnchorPosition - prevAnchorPosition;
      // scrollBy acts weird on safari
      scrollingElement.scrollTop += scrollPositionDiff;
    }
  });

  React.useLayoutEffect(() => {
    preserveScrollPosition();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, reactiveValue);
}
