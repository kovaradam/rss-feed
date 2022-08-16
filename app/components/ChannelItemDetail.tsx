import {
  BookmarkIcon as OutlineBookmarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline';
import {
  BookmarkIcon as SolidBookmarkIcon,
  CheckCircleIcon as SolidCheckIcon,
} from '@heroicons/react/solid';
import type { FormProps } from '@remix-run/react';
import { useLocation } from '@remix-run/react';
import { Form } from '@remix-run/react';

import React from 'react';
import { Link } from 'react-router-dom';
import type { ItemWithChannel } from '~/models/channel.server';
import { ChannelCategoryLinks } from './ChannelCategories';
import { Href } from './Href';
import { TimeFromNow } from './TimeFromNow';

type Props = { item: ItemWithChannel; formMethod: FormProps['method'] };

export function ChannelItemDetail(props: Props): JSX.Element {
  const { channel, ...item } = props.item;
  const ReadIcon = item.read ? SolidCheckIcon : CheckCircleIcon;
  const BookmarkIcon = item.bookmarked
    ? SolidBookmarkIcon
    : OutlineBookmarkIcon;

  return (
    <article
      className={`flex flex-col gap-1 rounded-lg p-4 shadow-md ${
        item.read ? 'opacity-50' : ''
      }`}
    >
      <span className="flex w-full justify-between text-slate-400">
        <Link to={channel.id} className="truncate pb-2 ">
          {channel.title}
        </Link>
        <fieldset className="flex gap-2">
          {[
            {
              name: ChannelItemDetail.form.names.read,
              value: String(!item.read),
              Icon: ReadIcon,
            },
            {
              name: ChannelItemDetail.form.names.bookmarked,
              value: String(!item.bookmarked),
              Icon: BookmarkIcon,
            },
          ].map((formItems) => (
            <Form method={props.formMethod} key={formItems.name}>
              <RequiredFormData itemLink={item.link} channelId={channel.id} />
              <input
                type="hidden"
                name={formItems.name}
                value={formItems.value}
              />
              <button type="submit">
                <formItems.Icon
                  className={`w-4 ${
                    formItems.value === 'false' ? 'text-black' : ''
                  }`}
                />
              </button>
            </Form>
          ))}
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

ChannelItemDetail.form = {
  names: {
    itemLink: 'itemLink',
    channelId: 'channelId',
    bookmarked: 'bookmarked',
    read: 'read',
    redirectTo: 'redirectTo',
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
  const location = useLocation();
  return (
    <>
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.itemLink}
        value={props.itemLink}
      />
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.channelId}
        value={props.channelId}
      />
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.redirectTo}
        value={location.pathname.concat(location.search)}
      />
    </>
  );
}
