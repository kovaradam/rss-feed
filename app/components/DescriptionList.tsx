export function DescriptionList(props: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      {...props}
      className={"flex flex-col gap-2 ".concat(props.className ?? "")}
    >
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
      className={"text-slate-500 dark:text-slate-400 "
        .concat(
          "visuallyHidden" in props && props.visuallyHidden === true
            ? "visually-hidden "
            : ""
        )
        .concat(props.className ?? "")}
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
      className={" text-slate-500 dark:text-slate-400 ".concat(
        props.className ?? ""
      )}
    >
      {props.children}
    </dd>
  );
};
