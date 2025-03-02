import { TimedTransition } from "./TimedTransition";

export function SpinTransition(props: React.PropsWithChildren) {
  return (
    <>
      <style href="SpinTransition">{`
        @keyframes spin {
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
          --to: 180deg;
          display:none;
        }

        .spin {
          animation-name: spin;
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
              className="h-full"
            >
              <div
                className={"spin spin-in h-full"}
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
              <div className={"spin spin-out h-full"}>{t.next}</div>
            </div>
          ) : (
            t.next
          )
        }
      />
    </>
  );
}
