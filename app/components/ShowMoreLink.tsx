import React from "react";
import { Form, useSearchParams } from "react-router";

type Props = React.ComponentProps<typeof Form> & {
  isLoading?: boolean;
  cursor: { name: string; value: string };
  otherValues?: { name: string; value: string }[];
};

/**
 * Form that acts as a link to maintain scroll position after navigation
 */
export function ShowMoreLink(props: Props) {
  const [searchParams] = useSearchParams();
  const otherValues = (props.otherValues ?? [])
    .concat(
      Array.from(searchParams.entries()).map(([name, value]) => ({
        value,
        name,
      })),
    )
    .filter(({ name }) => name !== props.cursor.name);

  return (
    <Form className={`mt-6 flex w-full justify-center ${props.className}`}>
      <button type={"submit"} className="hover:underline dark:text-white">
        <input
          type="hidden"
          name={props.cursor.name}
          value={props.cursor.value}
        />
        {otherValues.map(({ value, name }) => (
          <input type="hidden" name={name} value={value} key={name + value} />
        ))}
        {props.isLoading ? "Loading..." : "Show more"}
      </button>
    </Form>
  );
}
