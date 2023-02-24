import { Form } from '@remix-run/react';
import React from 'react';

type Props = React.ComponentProps<typeof Form> & {
  isLoading?: boolean;
  cursor: { name: string; value: string };
};

/**
 * Form that acts as a link to maintain scroll position after navigation
 */
export function ShowMoreLink(props: Props): JSX.Element {
  const isLoading = props.isLoading;
  return (
    <Form className={`mt-6 flex w-full justify-center ${props.className}`}>
      <button type={'submit'} className="hover:underline">
        <input
          type="hidden"
          name={props.cursor.name}
          value={props.cursor.value}
        />
        {isLoading ? 'Loading...' : 'Show more'}
      </button>
    </Form>
  );
}
