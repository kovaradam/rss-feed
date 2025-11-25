import clsx from "clsx";

export function PageHeading(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h3
      {...props}
      className={clsx(
        "mb-2 max-w-[30ch] text-3xl font-bold whitespace-break-spaces sm:text-3xl",
        props.className,
      )}
    >
      {props.children}
    </h3>
  );
}
