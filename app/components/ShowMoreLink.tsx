import type { Link } from '@remix-run/react';
import { Form } from '@remix-run/react';
import React from 'react';

type Props = React.ComponentProps<typeof Link> & {
  isLoading: boolean;
  to: string;
};

/**
 * Form that acts as a link to maintain scroll position after navigation
 */
export function ShowMoreLink(props: Props): JSX.Element {
  return (
    <Form
      action={props.to}
      className={`mt-6 flex w-full justify-center ${props.className}`}
    >
      <button type={'submit'} className="hover:underline">
        {props.isLoading ? 'Loading...' : 'Show more'}
      </button>
    </Form>
  );
}
