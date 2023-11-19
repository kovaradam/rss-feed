import { BanIcon } from '@heroicons/react/outline';
import { Form, useLocation } from '@remix-run/react';
import React from 'react';
import type { Channel, ChannelItemsFilter } from '~/models/channel.server';
import { styles } from '~/styles/shared';
import { Button } from './Button';

type Props = {
  filters: Partial<ChannelItemsFilter>;
  channels?: Channel[];
  categories?: string[];
  className?: string;
  formId: string;
};

export function ChannelItemFilterForm(props: Props): JSX.Element {
  const { filters, ...data } = props;
  const hasFilters = Boolean(
    filters.after ||
      filters.before ||
      filters.categories?.length ||
      filters.channels?.length
  );
  const { pathname } = useLocation();
  const formRef = React.useRef<HTMLFormElement>(null);
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <Form
        id={props.formId}
        ref={formRef}
        method="get"
        className={`flex flex-col gap-6 ${props.className}`}
        onChange={() => submitButtonRef.current?.click()}
      >
        <fieldset className="flex flex-col gap-4">
          {filters.after !== undefined && (
            <label className={labelClassName}>
              Published after
              <input
                name="after"
                type="date"
                className={inputClassName}
                defaultValue={filters.after ?? undefined}
              />
            </label>
          )}
          {filters.before !== undefined && (
            <label className={labelClassName}>
              Published before
              <input
                name="before"
                type="date"
                className={inputClassName}
                defaultValue={filters.before ?? undefined}
              />
            </label>
          )}
        </fieldset>
        <div className="flex flex-col gap-4 empty:hidden">
          {props.filters.categories !== undefined && (
            <fieldset className={labelClassName}>
              <legend>Show only selected channels</legend>
              <ul className={styles.input.concat('')}>
                {data.channels?.map((channel) => (
                  <li key={channel.id}>
                    <label className="flex cursor-pointer items-baseline gap-2 hover:bg-slate-100">
                      <input
                        name="channels"
                        type="checkbox"
                        value={channel.id}
                        id={channel.id}
                        checked={filters.channels?.includes(channel.id)}
                      />
                      {channel.title}
                    </label>
                  </li>
                ))}
                {(data.channels?.length ?? 0) === 0 && (
                  <li className="text-slate-500">No channels yet</li>
                )}
              </ul>
            </fieldset>
          )}
          {props.filters.channels !== undefined && (
            <fieldset className={labelClassName}>
              <legend>Filter by categories</legend>
              <ul className={styles.input.concat('')}>
                {data.categories?.map((category) => (
                  <li key={category}>
                    <label className="flex cursor-pointer items-baseline gap-1 hover:bg-slate-100">
                      <input
                        name="categories"
                        type="checkbox"
                        value={category}
                        id={category}
                        checked={filters.categories?.includes(category)}
                      />
                      {category}
                    </label>
                  </li>
                ))}
                {(data.categories?.length ?? 0) === 0 && (
                  <li className="text-slate-500">No categories yet</li>
                )}
              </ul>
            </fieldset>
          )}
        </div>
        {hasFilters && (
          <fieldset className="flex flex-col gap-1 ">
            <Button
              secondary
              form="reset-filters"
              type="submit"
              className="flex items-center justify-center gap-2"
            >
              <BanIcon className="w-4" /> Disable filters
            </Button>
          </fieldset>
        )}
        <button type="submit" ref={submitButtonRef} className="hidden"></button>
      </Form>
      {hasFilters && (
        <Form
          id="reset-filters"
          action={pathname}
          onSubmit={() => {
            formRef.current
              ?.querySelectorAll(`input, select`)
              .forEach((element) => {
                (element as HTMLInputElement).value = '';
              });
            document
              .querySelectorAll(`[form='${props.formId}']`)
              .forEach((element) => {
                (element as HTMLInputElement).value = '';
              });
          }}
        />
      )}
    </>
  );
}

const inputClassName = styles.input;

const labelClassName = 'flex flex-row justify-between gap-2 sm:flex-col';
