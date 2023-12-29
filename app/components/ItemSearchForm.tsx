import React from 'react';
import { styles } from '~/styles/shared';

export function ItemSearchForm(props: {
  defaultValue?: string;
  formId: string;
}) {
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const debounceId = React.useRef(-1);

  return (
    <>
      <input
        form={props.formId}
        name="q"
        defaultValue={props.defaultValue}
        placeholder="Search in articles"
        onChange={() => {
          window.clearTimeout(debounceId.current);
          debounceId.current = window.setTimeout(
            () => submitButtonRef.current?.click(),
            500
          );
        }}
        className={styles.input.concat(' mb-4 py-2 text-center sm:text-left')}
      />
      <button
        type="submit"
        form={props.formId}
        className="hidden"
        ref={submitButtonRef}
      />
    </>
  );
}
