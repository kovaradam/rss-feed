import React from "react";

type Position = {
  readonly x: "left" | "right" | "left-box";
  readonly y: "top" | "bottom";
};

let tooltipActiveMode = false;
let resetDelayTimeoutId = -1;

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
  const showTimeoutRef = React.useRef(-1);

  const target = props.target ?? elementRef?.parentElement;

  const getTarget = React.useCallback(() => target, [target]);

  const show = React.useEffectEvent(() => {
    clearTimeout(showTimeoutRef.current);

    clearTimeout(resetDelayTimeoutId);
    const target = getTarget();

    if (!target) {
      return;
    }

    showTimeoutRef.current = window.setTimeout(
      () => {
        if (!elementRef) {
          return;
        }
        assignPosition(elementRef, target, props.position);
        const handleScroll = () => {
          // update popover position on scroll
          assignPosition(elementRef, target, props.position);
        };

        document.body.addEventListener("scroll", handleScroll, {
          passive: true,
        });
        elementRef?.addEventListener("toggle", (e) => {
          if (e instanceof ToggleEvent && e.newState === "closed") {
            document.body.removeEventListener("scroll", handleScroll);
          }
        });

        tooltipActiveMode = true;

        elementRef.showPopover();
      },
      tooltipActiveMode ? 0 : 500,
    );
  });

  const hide = React.useEffectEvent(() => {
    clearTimeout(showTimeoutRef.current);
    resetDelayTimeoutId = window.setTimeout(() => {
      tooltipActiveMode = false;
    }, 1000);
    elementRef?.hidePopover();
  });

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
  }, [id, getTarget]);

  return (
    <div
      popover="auto"
      className={`items-center justify-center rounded bg-slate-950/90 p-2 whitespace-nowrap text-white dark:border`}
      style={{ display: "none" /** for unsupported browsers */ }}
      id={id}
      ref={(e) => {
        if (e) setElementRef(e);
      }}
    >
      {target?.getAttribute("aria-label") ?? props.children}
    </div>
  );
}

function assignPosition(
  element: HTMLElement,
  target: HTMLElement,
  positionParam?: Partial<Position>,
) {
  const targetRect = target?.getBoundingClientRect();
  const targetCenter = {
    left: targetRect.left + (targetRect.right - targetRect.left) / 2,
    top: targetRect.top + (targetRect.bottom - targetRect.top) / 2,
  };

  const position = {
    x:
      positionParam?.x ??
      (targetCenter.left / window.innerWidth > 0.5 ? "left" : "right"),
    y:
      positionParam?.y ??
      (targetCenter.top / window.innerHeight > 0.5 ? "top" : "bottom"),
  };

  element.style.transform = "";
  element.style.display = "";
  if (position.x === "left") {
    element.style.left = targetRect.left + "px";
    element.style.transform += "translateX(-100%)";
  }
  if (position.x === "right") {
    element.style.left = targetRect.right + "px";
  }
  if (position.y === "bottom") {
    element.style.top = targetRect.bottom + "px";
  }
  if (position.y === "top") {
    element.style.top = targetRect.top + "px";
    element.style.transform += "translateY(-100%)";
  }
}
