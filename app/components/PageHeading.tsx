import clsx from "clsx";

export function PageHeading(props: React.ComponentProps<"h3">) {
  return (
    <h3
      {...props}
      className={clsx(
        "max-w-[30ch] text-3xl font-bold whitespace-break-spaces sm:text-3xl dark:font-[MerriWeather] dark:font-normal",
        props.className,
      )}
    >
      {props.children}
    </h3>
  );
}

export function PageHeader(props: React.ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={clsx("mb-4 flex justify-between gap-2", props.className)}
    >
      {props.children}
    </header>
  );
}
