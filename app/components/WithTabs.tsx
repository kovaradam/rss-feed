import React, { useId } from "react";
import { Link, useSearchParams } from "react-router";
import { styles } from "~/styles/shared";
import { mapValue } from "~/utils/map-value";

export function WithTabs<T extends string>(props: {
  options: Array<{
    value: T;
    tabLabel: React.ReactNode;
    tabPanel: React.ReactNode;
  }>;
  className?: string;
  disabled?: boolean;
  isVertical?: boolean;
  queryParam: string;
}) {
  const [searchParams] = useSearchParams();
  const currentValue = searchParams.get(props.queryParam);

  const currentOptionIndex = Math.max(
    props.options.findIndex((o) => o.value === currentValue),
    0
  );

  const [focusedIndex, setFocusedIndex] = React.useState<null | number>(null);
  const isVertical =
    useMediaQuery("(max-width: 640px)") || props.isVertical === true;

  const id = useId();

  return (
    <>
      <fieldset
        disabled={props.disabled}
        className={`${styles.input} script-only grid  gap-[var(--gap)] bg-gray-50 py-1 pl-1 pr-1 [--gap:0.25rem] sm:[--hor:0] ${props.className}`}
        style={{
          [isVertical ? "gridTemplateRows" : "gridTemplateColumns"]:
            `repeat(${props.options.length}, 1fr)`,
        }}
        onKeyDown={(e) => {
          const tablist = e.currentTarget;
          const firstTab = tablist.querySelector(
            `a:first-of-type`
          ) as HTMLButtonElement;
          const lastTab = tablist.querySelector(
            `a:last-of-type`
          ) as HTMLButtonElement;
          switch (e.key) {
            case isVertical ? "ArrowUp" : "ArrowLeft": {
              (
                (tablist.querySelector(`a:nth-of-type(${focusedIndex ?? 1})`) ??
                  lastTab) as HTMLButtonElement
              )?.focus();
              e.preventDefault();
              break;
            }
            case isVertical ? "ArrowDown" : "ArrowRight": {
              (
                (tablist.querySelector(
                  `a:nth-of-type(${(focusedIndex ?? 0) + 2})`
                ) ?? firstTab) as HTMLButtonElement
              )?.focus();
              e.preventDefault();
              break;
            }
            case "Home":
              firstTab?.focus();
              e.preventDefault();
              break;
            case "End":
              lastTab?.focus();
              e.preventDefault();
              break;
          }
        }}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role="tablist"
        tabIndex={0}
      >
        <span
          className="bg-white shadow"
          style={{
            gridRow: 1,
            gridColumn: 1,
            transform: `translate${isVertical ? "Y" : "X"}(calc(${
              100 * currentOptionIndex
            }% + calc(var(--gap) * ${currentOptionIndex})))`,
            zIndex: 0,
            transition: `transform 100ms var(--ease)`,
          }}
        ></span>
        {props.options.map((option, index) => (
          <Link
            key={option.value as string}
            to={{
              search: mapValue(new URLSearchParams(searchParams))((params) => {
                params.set(props.queryParam, option.value);
                return params.toString();
              }),
            }}
            className={"rounded-sm p-1 text-center ".concat(
              option.value === currentValue
                ? ""
                : "text-gray-600 hover:bg-gray-100 hover:text-inherit"
            )}
            style={{
              zIndex: 1,
              ...(isVertical
                ? { gridRow: index + 1, gridColumn: 1 }
                : { gridColumn: index + 1, gridRow: 1 }),
            }}
            role="tab"
            aria-selected={option.value === currentValue}
            aria-controls={`panel-${option.value}`}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                if (e.shiftKey) {
                  (
                    e.currentTarget.closest('[role="tablist"]') as HTMLElement
                  ).focus();
                  return;
                }

                const controlled = document.querySelector(
                  `[data-visible-panel-for="${id}"]`
                ) as HTMLElement;

                if (controlled) {
                  controlled.focus();
                }
              }
            }}
          >
            {option.tabLabel}
          </Link>
        ))}
      </fieldset>
      {props.options.map((tab, index) => (
        <div
          key={`panel-${tab.value}`}
          id={`panel-${tab.value}`}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`tab-${tab.value}`}
          hidden={index !== currentOptionIndex}
          data-visible-panel-for={index === currentOptionIndex ? id : undefined}
        >
          {tab.tabPanel}
        </div>
      ))}
    </>
  );
}

function useMediaQuery(query: string) {
  const [matches, update] = React.useReducer(
    () => globalThis.matchMedia(query).matches,
    globalThis.matchMedia(query).matches
  );
  React.useEffect(() => {
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [query]);

  return matches;
}
