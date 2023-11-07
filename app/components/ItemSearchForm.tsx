import { Form } from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';

export function ItemSearchForm(props: {
  onChange: React.ComponentProps<typeof Form>['onChange'];
  defaultValue?: string;
}) {
  const debounceHandle = React.useRef(-1);

  return (
    <Form
      onChange={(event) => {
        window.clearTimeout(debounceHandle.current);
        const form = event.currentTarget;
        debounceHandle.current = window.setTimeout(
          () => props.onChange?.({ ...event, currentTarget: form }),
          300
        );
      }}
      className="mb-4"
    >
      <input
        name="q"
        defaultValue={props.defaultValue}
        placeholder="Search in articles"
        className={styles.input.concat(' py-2')}
      />
    </Form>
  );
}
