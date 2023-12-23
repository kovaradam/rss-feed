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
  canExcludeRead?: boolean;
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
            <fieldset className={labelClassName}>
              <legend>
                <label htmlFor="after">Published after</label>
              </legend>
              <input
                name="after"
                id="after"
                type="date"
                key={filters.after}
                className={inputClassName}
                defaultValue={filters.after ?? undefined}
              />
            </fieldset>
          )}
          {filters.before !== undefined && (
            <fieldset className={labelClassName}>
              <legend>
                <label htmlFor="before">Published before</label>
              </legend>
              <input
                name="before"
                id="before"
                type="date"
                key={filters.before}
                className={inputClassName}
                defaultValue={filters.before ?? undefined}
              />
            </fieldset>
          )}
        </fieldset>
        <div className="flex flex-col gap-4 empty:hidden">
          {props.filters.categories !== undefined && (
            <fieldset className={labelClassName}>
              <legend>Filter by channels</legend>
              <ul className={styles.input.concat('')}>
                {data.channels?.map((channel) => (
                  <li key={channel.id}>
                    <label className="flex cursor-pointer items-baseline gap-2 hover:bg-slate-100">
                      <input
                        key={String(filters.channels)}
                        name="channels"
                        type="checkbox"
                        value={channel.id}
                        id={channel.id}
                        defaultChecked={filters.channels?.includes(channel.id)}
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
                        key={String(filters.categories)}
                        name="categories"
                        type="checkbox"
                        value={category}
                        id={category}
                        defaultChecked={filters.categories?.includes(category)}
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
          {props.canExcludeRead && (
            <fieldset className={labelClassName}>
              <legend>Filter by state</legend>
              <ul className={styles.input.concat('')}>
                {[
                  {
                    name: 'exclude-read',
                    label: 'Exclude read articles',
                    value: filters.excludeRead ?? false,
                  },
                ].map((field) => (
                  <li key={field.name}>
                    <label className="flex cursor-pointer items-baseline gap-1 hover:bg-slate-100">
                      <input
                        key={String(field.value)}
                        name={field.name}
                        type="checkbox"
                        value={String(field.value)}
                        id={field.name}
                        defaultChecked={field.value}
                      />
                      {field.label}
                    </label>
                  </li>
                ))}
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

const labelClassName =
  'flex flex-row justify-between gap-2 sm:flex-col text-red';
