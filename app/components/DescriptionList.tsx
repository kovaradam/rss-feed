import { clsx } from "clsx";

export function DescriptionList(props: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl {...props} className={clsx("flex flex-col gap-2 ", props.className)}>
      {props.children}
    </dl>
  );
}

DescriptionList.Term = function DescriptionTerm(
  props: React.HTMLAttributes<HTMLElement> &
    (
      | {
          children: React.ReactNode;
        }
      | { visuallyHidden: true; children: string }
    )
) {
  return (
    <dt
      {...props}
      className={clsx(
        "text-slate-500 dark:text-slate-400",
        "visuallyHidden" in props &&
          props.visuallyHidden === true &&
          "_visually-hidden",
        props.className
      )}
    >
      {props.children}
    </dt>
  );
};

DescriptionList.Definition = function DescriptionDefinition(
  props: React.HTMLAttributes<HTMLElement>
) {
  return (
    <dd
      {...props}
      className={clsx("text-slate-500 dark:text-slate-400", props.className)}
    >
      {props.children}
    </dd>
  );
};
