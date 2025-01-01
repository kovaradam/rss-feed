import { XIcon } from "@heroicons/react/outline";
import { Link } from "react-router";
import type { MouseEventHandler } from "react";
import { Tooltip } from "./Tooltip";

type Props = {
  category: string;
  onDelete?: MouseEventHandler<HTMLButtonElement>;
  formName?: string;
};

const className =
  "flex gap-1 rounded text-slate-600 p-1 px-2  bg-slate-100 dark:bg-slate-500 dark:text-white";

export function ChannelCategories(props: Props): JSX.Element {
  return (
    <>
      {props.category
        .split("/")
        .filter(Boolean)
        .map((category) => (
          <span className={className} key={category}>
            {category}
            {props.onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  props.onDelete?.(e);
                }}
                value={category}
                name="delete-category"
                type="submit"
                aria-label="Remove category"
                className="relative"
              >
                <XIcon className="w-4" />
                <Tooltip />
              </button>
            )}
            {props.formName && (
              <input type="hidden" value={category} name={props.formName} />
            )}
          </span>
        ))}
    </>
  );
}

export function ChannelCategoryLinks(
  props: Omit<Props, "delete">
): JSX.Element {
  return (
    <>
      {props.category
        .split("/")
        .filter(Boolean)
        .map((category) => (
          <Link
            className={"relative ".concat(className)}
            key={category}
            to={`/channels?categories=${category}`}
          >
            {category}
            <Tooltip>View articles with this category</Tooltip>
          </Link>
        ))}
    </>
  );
}
