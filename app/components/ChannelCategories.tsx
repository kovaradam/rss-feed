import { XIcon } from '@heroicons/react/outline';
import { Link } from '@remix-run/react';
import type { MouseEventHandler } from 'react';
import React from 'react';
import { Tooltip } from './Tooltip';

type Props = {
  category: string;
  delete?: MouseEventHandler<HTMLButtonElement>;
};

const className = 'flex gap-1 rounded text-slate-600 p-1 px-2  bg-slate-100';

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
              <button
                onClick={props.delete}
                value={category}
                type="button"
                aria-label="Remove category"
                className="relative"
              >
                <XIcon className="w-4" />
                <Tooltip />
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
            className={'relative '.concat(className)}
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
