import { BanIcon } from '@heroicons/react/outline';
import { Form, useLocation } from '@remix-run/react';
import React from 'react';
import type { Channel, ChannelItemsFilter } from '~/models/channel.server';
import { Button } from './Button';

type Props = {
  submitFilters: React.FormEventHandler<HTMLFormElement>;
  filters: Partial<ChannelItemsFilter>;
  channels?: Channel[];
  categories?: string[];
  className?: string;
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

  return (
    <>
      <Form
        method="get"
        className={`flex flex-col gap-6 ${props.className}`}
        onChangeCapture={props.submitFilters}
      >
        <fieldset className="flex flex-col gap-4">
          {props.filters.categories !== undefined && (
            <label className={labelClassName}>
              Filter channels
              <select
                name="channels"
                defaultValue={filters.channels}
                title={
                  data.channels?.length
                    ? 'Select channels'
                    : 'No channels found'
                }
                multiple
                className={inputClassName}
              >
                {data.channels?.map((channel) => (
                  <option value={channel.id} key={channel.id}>
                    {channel.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {props.filters.channels !== undefined && (
            <label className={labelClassName}>
              Filter categories
              <select
                name="categories"
                defaultValue={filters.categories}
                className={inputClassName}
                title={
                  data.categories?.length
                    ? 'Select categories'
                    : 'No categories found'
                }
                multiple
              >
                {data.categories?.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
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
      </Form>
      <Form id="reset-filters" action={pathname} />
    </>
  );
}

const inputClassName =
  'w-full rounded  bg-slate-100 p-2 px-2 py-1 text-slate-600';

const labelClassName = 'flex flex-row justify-between gap-2 sm:flex-col';
