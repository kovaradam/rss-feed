import { BanIcon } from "@heroicons/react/outline";
import { Form, useLocation } from "react-router";
import React from "react";
import type { Channel, ChannelItemsFilter } from "~/models/channel.server";
import { styles } from "~/styles/shared";
import { Button } from "./Button";
import { WithFormLabel } from "./WithFormLabel";
import { isEmptyObject } from "~/utils/is-empty-object";

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
  const hasFilters = !isEmptyObject(filters);

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
        <div className="flex flex-col gap-4">
          {filters.after !== undefined && (
            <WithFormLabel label="Published after" htmlFor="after">
              {({ htmlFor }) => (
                <input
                  name={ChannelItemFilterForm.names.after}
                  id={htmlFor}
                  type="date"
                  key={filters.after}
                  className={inputClassName}
                  defaultValue={filters.after ?? undefined}
                />
              )}
            </WithFormLabel>
          )}
          {filters.before !== undefined && (
            <WithFormLabel htmlFor="before" label="Published before">
              {({ htmlFor }) => (
                <input
                  name={ChannelItemFilterForm.names.before}
                  id={htmlFor}
                  type="date"
                  key={filters.before}
                  className={inputClassName}
                  defaultValue={filters.before ?? undefined}
                />
              )}
            </WithFormLabel>
          )}
        </div>
        <div className="flex flex-col gap-4 empty:hidden">
          {props.filters.categories !== undefined && (
            <WithFormLabel label="Filter by channels">
              <ul className={styles.input.concat("")}>
                {data.channels?.map((channel) => (
                  <li key={channel.id}>
                    <label className="flex cursor-pointer items-baseline gap-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                      <input
                        key={String(filters.channels)}
                        name="channels"
                        type="checkbox"
                        value={channel.id}
                        id={channel.id}
                        defaultChecked={filters.channels?.includes(channel.id)}
                        className="min-w-[1rem]"
                      />
                      {channel.title}
                    </label>
                  </li>
                ))}
                {(data.channels?.length ?? 0) === 0 && (
                  <li className="text-slate-500">No channels yet</li>
                )}
              </ul>
            </WithFormLabel>
          )}
          {props.filters.channels !== undefined && (
            <WithFormLabel label={"Filter by categories"}>
              <ul className={styles.input.concat("")}>
                {data.categories?.map((category) => (
                  <li key={category}>
                    <label className="flex cursor-pointer items-baseline gap-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                      <input
                        key={String(filters.categories)}
                        name="categories"
                        type="checkbox"
                        value={category}
                        id={category}
                        defaultChecked={filters.categories?.includes(category)}
                        className="min-w-[1rem]"
                      />
                      {category}
                    </label>
                  </li>
                ))}
                {(data.categories?.length ?? 0) === 0 && (
                  <li className="text-slate-500">No categories yet</li>
                )}
              </ul>
            </WithFormLabel>
          )}
          {props.canExcludeRead && (
            <WithFormLabel label={"Filter by state"}>
              <ul className={styles.input.concat("")}>
                {[
                  {
                    name: ChannelItemFilterForm.names.excludeRead,
                    label: "Include read articles",
                    currentValue: filters.excludeRead === false,
                  },
                  {
                    name: ChannelItemFilterForm.names.includeHiddenFromFeed,
                    label: "Include hidden from feed",
                    currentValue: filters.excludeHiddenFromFeed === false,
                  },
                ].map((field) => (
                  <li key={field.name}>
                    <label className="flex cursor-pointer items-baseline gap-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                      <input
                        key={String(field.currentValue)}
                        name={field.name}
                        type="checkbox"
                        value={String(true)}
                        id={field.name}
                        defaultChecked={field.currentValue}
                        className="min-w-[1rem]"
                      />
                      {field.label}
                    </label>
                  </li>
                ))}
              </ul>
            </WithFormLabel>
          )}
        </div>
        {hasFilters && (
          <fieldset className="flex flex-col gap-1 ">
            <Button form="reset-filters" type="submit" className="w-full ">
              <BanIcon className="w-4" />
              <span className="flex-1 items-center">Disable filters</span>
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
                (element as HTMLInputElement).value = "";
              });
            document
              .querySelectorAll(`[form='${props.formId}']`)
              .forEach((element) => {
                (element as HTMLInputElement).value = "";
              });
          }}
        />
      )}
    </>
  );
}

const inputClassName = styles.input;

ChannelItemFilterForm.names = {
  before: "before",
  after: "after",
  includeHiddenFromFeed: "include-hidden-from-feed",
  excludeRead: "exclude-read",
};
