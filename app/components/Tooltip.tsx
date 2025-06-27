import React, { useEffect } from "react";

type Position = {
  readonly x: "left" | "right" | "left-box";
  readonly y: "top" | "bottom";
};

export function Tooltip(
  props: React.PropsWithChildren<{
    target?: HTMLElement;
    position?: Partial<Position>;
  }>,
) {
  const id = React.useId();
  const [elementRef, setElementRef] = React.useState<HTMLDivElement | null>(
    null,
  );
  const positionTimeoutRef = React.useRef(-1);
  const [position, setPosition] = React.useState<Position | null>(null);

  const getTarget = React.useCallback(
    () => props.target ?? elementRef?.parentElement,
    [props.target, elementRef],
  );

  const show = React.useCallback(() => {
    clearTimeout(positionTimeoutRef.current);
    const target = getTarget();

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
            (targetCenter.left / window.innerWidth > 0.5 ? "left" : "right"),
          y:
            props.position?.y ??
            (targetCenter.top / window.innerHeight > 0.5 ? "top" : "bottom"),
        }),
      500,
    );
  }, [getTarget, props.position]);

  const hide = React.useCallback(() => {
    clearTimeout(positionTimeoutRef.current);
    setPosition(null);
  }, []);

  React.useEffect(() => {
    const target = getTarget();

    if (!target) {
      return;
    }
    target?.setAttribute("aria-describedby", id);
    target?.setAttribute("interesttarget", id);

    const controller = new AbortController();

    target.addEventListener("mouseover", show, { signal: controller.signal });
    target.addEventListener("focus", show, { signal: controller.signal });
    target.addEventListener("blur", hide, { signal: controller.signal });
    target.addEventListener("mouseleave", hide, { signal: controller.signal });
    target.addEventListener("click", hide, { signal: controller.signal });

    return () => controller.abort();
  }, [id, getTarget, show, hide]);

  useEffect(() => {
    if (!position) {
      return;
    }

    const controller = new AbortController();
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          hide();
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [position, hide]);

  return (
    <div
      popover={"hint" as never}
      className={`absolute z-50 ${
        position ? "flex" : "hidden"
      } items-center justify-center whitespace-nowrap rounded bg-slate-950 bg-opacity-90 p-2 text-white dark:border`}
      style={{
        left: {
          right: "100%",
          "left-box": 0,
          left: "auto",
        }[position?.x ?? "left"],
        right: position?.x === "left" ? "100%" : "auto",
        top: position?.y === "bottom" ? "100%" : "auto",
        bottom: position?.y === "top" ? "100%" : "auto",
      }}
      id={id}
      ref={(e) => {
        if (e) setElementRef(e);
      }}
    >
      {getTarget()?.getAttribute("aria-label") ?? props.children}
    </div>
  );
}
