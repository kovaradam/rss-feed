import { XIcon } from '@heroicons/react/outline';
import { Link } from '@remix-run/react';
import type { MouseEventHandler } from 'react';
import React from 'react';

type Props = {
  category: string;
  delete?: MouseEventHandler<HTMLButtonElement>;
};

const className = 'flex gap-1 rounded bg-orange-400 px-1 text-white';
export function ChannelCategories(props: Props): JSX.Element {
  return (
    <>
      {props.category
        .split('/')
        .filter(Boolean)
        .map((category) => (
          <span className={className} key={category}>
            {category}
            {props.delete && (
              <button onClick={props.delete} value={category} type="button">
                <XIcon className="w-4" />
              </button>
            )}
          </span>
        ))}
    </>
  );
}

export function ChannelCategoryLinks(
  props: Omit<Props, 'delete'>
): JSX.Element {
  return (
    <>
      {props.category
        .split('/')
        .filter(Boolean)
        .map((category) => (
          <Link
            className={className}
            key={category}
            to={`/channels?categories=${category}`}
          >
            {category}
          </Link>
        ))}
    </>
  );
}