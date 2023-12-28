export function PageHeading(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h2
      {...props}
      className={'mb-2 text-4xl font-bold sm:text-3xl '.concat(
        props.className ?? ''
      )}
    >
      {props.children}
    </h2>
  );
}
