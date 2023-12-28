import type { LinkProps } from '@remix-run/react';
import { Link } from '@remix-run/react';
import { SubmitButton } from './Button';

export function SubmitSection(props: {
  cancelProps: LinkProps;
  submitProps: React.ComponentProps<typeof SubmitButton>;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
      <Link
        {...props.cancelProps}
        className={'w-full p-2 text-center sm:w-min '.concat(
          props.cancelProps.className ?? ''
        )}
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
