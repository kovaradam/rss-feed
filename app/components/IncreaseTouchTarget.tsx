import clsx from "clsx";

export function IncreaseTouchTarget({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        `absolute inset-0 scale-200 pointer-fine:hidden`,
        className,
      )}
    />
  );
}
