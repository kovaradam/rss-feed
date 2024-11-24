import type { LinkProps } from 'react-router';
import { Link } from 'react-router';
import { SubmitButton, buttonStyle } from './Button';

export function SubmitSection(props: {
  cancelProps: LinkProps;
  submitProps: React.ComponentProps<typeof SubmitButton>;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
      <Link
        {...props.cancelProps}
        className={`${buttonStyle} w-full justify-center rounded bg-slate-200 p-2 sm:w-min ${props.cancelProps.className}`}
        to={props.cancelProps.to}
      >
        {props.cancelProps.children ?? 'Cancel'}
      </Link>
      <SubmitButton
        {...props.submitProps}
        className={'w-full whitespace-nowrap sm:w-min'.concat(
          props.submitProps.className ?? ''
        )}
        isLoading={props.isSubmitting}
      >
        {props.submitProps.children}
      </SubmitButton>
    </div>
  );
}
