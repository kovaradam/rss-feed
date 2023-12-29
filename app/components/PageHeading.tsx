export function PageHeading(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h3
      {...props}
      className={'mb-2 text-4xl font-bold dark:text-white sm:text-3xl '.concat(
        props.className ?? ''
      )}
    >
      {props.children}
    </h3>
  );
}
