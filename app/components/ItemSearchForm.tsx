import React from 'react';
import { styles } from '~/styles/shared';

export function ItemSearchForm(props: {
  defaultValue?: string;
  formId: string;
}) {
  return (
    <input
      form={props.formId}
      name="q"
      defaultValue={props.defaultValue}
      placeholder="Search in articles"
      className={styles.input.concat(' mb-4 py-2')}
    />
  );
}
