export function PageHeading(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h3
      {...props}
      className={"mb-2 max-w-[30ch] whitespace-break-spaces text-3xl font-bold sm:text-3xl dark:text-white ".concat(
        props.className ?? ""
      )}
    >
      {props.children}
    </h3>
  );
}
