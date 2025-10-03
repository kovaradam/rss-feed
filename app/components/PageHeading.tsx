import clsx from "clsx";

export function PageHeading(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h3
      {...props}
      className={clsx(
        "mb-2 max-w-[30ch] whitespace-break-spaces text-3xl font-bold sm:text-3xl dark:text-white",
        props.className,
      )}
    >
      {props.children}
    </h3>
  );
}
