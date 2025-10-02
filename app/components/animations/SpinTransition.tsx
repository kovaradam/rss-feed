import clsx from "clsx";
import { TimedTransition } from "./TimedTransition";

export function SpinTransition(
  props: React.PropsWithChildren<{ className?: string }>,
) {
  return (
    <>
      <style href="SpinTransition">{`
        @keyframes spin3d {
          from {
            transform: rotate3d(0, 1, 0, var(--from));
          }
          to {
            transform: rotate3d(0, 1, 0, var(--to));
          }
        }

        .spin-in {
          --from: 0deg;
          --to: 90deg;
        }

        .spin-out {
          --from: 90deg;
          --to: 0deg;
          display:none;
        }

        .spin {
          animation-name: spin3d;
          animation-duration: calc(var(--timeout) / 2);
          animation-fill-mode: forwards;
        }
        `}</style>
      <TimedTransition
        timeout={200}
        value={props.children}
        render={(t) =>
          t.isTransition ? (
            <div
              style={{ "--timeout": `${t.timeout}ms` } as never}
              className={clsx("h-full", props.className)}
            >
              <div
                className={"spin spin-in"}
                onAnimationEnd={(e) => {
                  e.currentTarget.style.display = "none";
                  const sibling = e.currentTarget.nextSibling as HTMLElement;
                  if (sibling) {
                    sibling.style.display = "block";
                  }
                }}
              >
                {t.prev}
              </div>
              <div className={"spin spin-out"}>{t.next}</div>
            </div>
          ) : (
            t.next
          )
        }
      />
    </>
  );
}
