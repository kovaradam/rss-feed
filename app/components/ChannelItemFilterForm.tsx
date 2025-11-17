import { BanIcon } from "@heroicons/react/outline";
import { Form, useLocation } from "react-router";
import React from "react";
import type { ChannelItemsFilter } from "~/models/channel.server";
import { styles } from "~/styles/shared";
import { Button } from "./Button";
import { WithFormLabel } from "./WithFormLabel";
import { isEmptyObject } from "~/utils/is-empty-object";
import { Channel } from "~/models/types.server";
import { List } from "./List";
import { enumerate } from "~/utils";
import clsx from "clsx";

type Props = {
  filters: Partial<ChannelItemsFilter>;
  channels?: Channel[];
  categories?: string[];
  className?: string;
  formId: string;
};

export function ChannelItemFilterForm(props: Props) {
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
        className={clsx(`flex flex-col gap-6`, props.className)}
        onChange={() => submitButtonRef.current?.click()}
      >
        <div className="overflow-x-hidden">
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
            <WithFormLabel
              htmlFor="before"
              label="Published before"
              className="mt-4"
            >
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
        <div className="empty:hidden">
          {props.filters.categories !== undefined && (
            <WithFormLabel label="Filter by channels" labelAs="div">
              <div className={styles.input}>
                <List>
                  {data.channels?.map((channel) => (
                    <li key={channel.id}>
                      <CheckboxLabel
                        inputSlot={
                          <input
                            key={String(filters.channels)}
                            name="channels"
                            type="checkbox"
                            value={channel.id}
                            id={channel.id}
                            defaultChecked={filters.channels?.includes(
                              channel.id,
                            )}
                            className="min-w-4"
                          />
                        }
                      >
                        {channel.title}
                      </CheckboxLabel>
                    </li>
                  ))}
                  {(data.channels?.length ?? 0) === 0 && (
                    <li className="text-slate-500">No channels yet</li>
                  )}
                </List>
              </div>
            </WithFormLabel>
          )}
          {props.filters.channels !== undefined && (
            <WithFormLabel
              label={"Filter by categories"}
              labelAs="div"
              className="mt-4"
            >
              <div className={styles.input}>
                <List>
                  {data.categories?.map((category) => (
                    <li key={category}>
                      <CheckboxLabel
                        inputSlot={
                          <input
                            key={String(filters.categories)}
                            name="categories"
                            type="checkbox"
                            value={category}
                            id={category}
                            defaultChecked={filters.categories?.includes(
                              category,
                            )}
                            className="min-w-4"
                          />
                        }
                      >
                        {category}
                      </CheckboxLabel>
                    </li>
                  ))}
                  {(data.categories?.length ?? 0) === 0 && (
                    <li className="text-slate-500">No categories yet</li>
                  )}
                </List>
              </div>
            </WithFormLabel>
          )}
          {props.filters.excludeHiddenFromFeed !== undefined && (
            <WithFormLabel
              label={"Filter by state"}
              labelAs="div"
              className="mt-4"
            >
              <div className={styles.input}>
                <List>
                  {[
                    {
                      name: ChannelItemFilterForm.names[
                        "include-hidden-from-feed"
                      ],
                      label: "Include hidden from feed",
                      currentValue: filters.excludeHiddenFromFeed === false,
                    },
                  ].map((field) => (
                    <li key={field.name}>
                      <CheckboxLabel
                        inputSlot={
                          <input
                            key={String(field.currentValue)}
                            name={field.name}
                            type="checkbox"
                            value={String(true)}
                            id={field.name}
                            defaultChecked={field.currentValue}
                            className="min-w-4"
                          />
                        }
                      >
                        {field.label}
                      </CheckboxLabel>
                    </li>
                  ))}
                </List>
              </div>
            </WithFormLabel>
          )}
        </div>
        {hasFilters && (
          <fieldset className="flex flex-col gap-1">
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

ChannelItemFilterForm.names = enumerate([
  "before",
  "after",
  "include-hidden-from-feed",
]);

function CheckboxLabel(
  props: React.ComponentProps<"label"> & { inputSlot: React.ReactNode },
) {
  return (
    <label
      {...props}
      className={clsx(
        "flex items-baseline gap-2 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-600 ",
        props.className,
      )}
    >
      <span className="flex items-center h-[1lh]">{props.inputSlot}</span>
      {props.children}
    </label>
  );
}
