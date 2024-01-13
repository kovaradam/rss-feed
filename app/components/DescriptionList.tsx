export function DescriptionList(props: React.HTMLAttributes<HTMLDListElement>) {
  return (
    <dl
      {...props}
      className={'flex flex-col gap-2 '.concat(props.className ?? '')}
    >
      {props.children}
    </dl>
  );
}

DescriptionList.Term = function DescriptionTerm(
  props: React.HTMLAttributes<HTMLElement>
) {
  return (
    <dt
      {...props}
      className={'text-slate-500 dark:text-slate-400 '.concat(
        props.className ?? ''
      )}
    >
      {props.children}
    </dt>
  );
};

DescriptionList.Detail = function DescriptionDetail(
  props: React.HTMLAttributes<HTMLElement>
) {
  return (
    <dd
      {...props}
      className={' text-slate-500 dark:text-slate-400 '.concat(
        props.className ?? ''
      )}
    >
      {props.children}
    </dd>
  );
};
