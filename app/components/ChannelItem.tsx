import {
  BookmarkIcon as OutlineBookmarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline';
import {
  BookmarkIcon as SolidBookmarkIcon,
  CheckCircleIcon as SolidCheckIcon,
} from '@heroicons/react/solid';
import type { FormProps } from '@remix-run/react';
import { Form } from '@remix-run/react';

import React from 'react';
import { Link } from 'react-router-dom';
import type { ItemWithChannel } from '~/models/channel.server';
import { ChannelCategoryLinks } from './ChannelCategories';
import { Href } from './Href';
import { TimeFromNow } from './TimeFromNow';

type Props = { item: ItemWithChannel; formMethod: FormProps['method'] };

export function ChannelItem(props: Props): JSX.Element {
  const { channel, ...item } = props.item;
  const ReadIcon = item.read ? SolidCheckIcon : CheckCircleIcon;
  const BookmarkIcon = item.bookmarked
    ? SolidBookmarkIcon
    : OutlineBookmarkIcon;
  return (
    <article className="flex flex-col gap-1 rounded-lg p-4 shadow-md">
      <span className="flex w-full justify-between">
        <Link to={channel.id} className="truncate pb-2 text-slate-400">
          {channel.title}
        </Link>
        <fieldset className="flex gap-2">
          <Form method={props.formMethod}>
            <RequiredFormData itemLink={item.link} channelId={channel.id} />
            <input
              type="hidden"
              name={ChannelItem.form.names.read}
              value={String(!item.read)}
            />
            <button type="submit">
              <ReadIcon className="w-4" />
            </button>
          </Form>
          <Form method={props.formMethod}>
            <RequiredFormData itemLink={item.link} channelId={channel.id} />
            <input
              type="hidden"
              name={ChannelItem.form.names.bookmarked}
              value={String(!item.bookmarked)}
            />

            <button type="submit">
              <BookmarkIcon className="w-4" />
            </button>
          </Form>
        </fieldset>
      </span>

      {item.imageUrl && (
        <img
          alt="Article decoration"
          src={item.imageUrl}
          className="my-2 h-auto w-full"
        />
      )}
      <h4>
        <Href href={item.link} className="text-lg text-black">
          {item.title}
        </Href>
      </h4>
      <span className="flex gap-1 text-slate-400">
        {item.author}
        <TimeFromNow date={new Date(item.pubDate)} />
      </span>
      <span className="mb-1 flex gap-1 text-sm">
        <ChannelCategoryLinks category={channel.category} />
      </span>
      <p className="line-clamp-10">{item.description}</p>
    </article>
  );
}

ChannelItem.form = {
  names: {
    itemLink: 'itemLink',
    channelId: 'channelId',
    bookmarked: 'bookmarked',
    read: 'read',
  },
  getBooleanValue(formValue: FormDataEntryValue | null): boolean | undefined {
    if (formValue === 'true') {
      return true;
    }
    if (formValue === 'false') {
      return false;
    }
    return undefined;
  },
};

function RequiredFormData(props: { itemLink: string; channelId: string }) {
  return (
    <>
      <input
        type="hidden"
        name={ChannelItem.form.names.itemLink}
        value={props.itemLink}
      />
      <input
        type="hidden"
        name={ChannelItem.form.names.channelId}
        value={props.channelId}
      />
    </>
  );
}
