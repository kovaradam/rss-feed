import {
  BookmarkIcon as OutlineBookmarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline';
import {
  BookmarkIcon as SolidBookmarkIcon,
  CheckCircleIcon as SolidCheckIcon,
} from '@heroicons/react/solid';
import type { FormProps } from '@remix-run/react';
import { Link, useFetcher } from '@remix-run/react';
import invariant from 'tiny-invariant';
import useSound from 'use-sound';
import type { ItemWithChannel } from '~/models/channel.server';
import { updateChannelItem } from '~/models/channel.server';
import { ChannelCategoryLinks } from './ChannelCategories';
import { Href } from './Href';
import { TimeFromNow } from './TimeFromNow';
import confirmSound from 'public/sounds/state-change_confirm-up.wav';
import cancelSound from 'public/sounds/state-change_confirm-down.wav';
import { Highlight } from './Highlight';
import { convert } from 'html-to-text';
import React from 'react';

type Props = {
  item: ItemWithChannel;
  formMethod: FormProps['method'];
  query?: string;
};

export function ChannelItemDetail(props: Props): JSX.Element {
  const { channel, ...item } = props.item;

  const fetcher = useFetcher();
  const [sentBookmarked, sentRead] = [
    fetcher.formData?.get(ChannelItemDetail.form.names.bookmarked) ?? null,
    fetcher.formData?.get(ChannelItemDetail.form.names.read) ?? null,
  ];

  const [bookmarked, read] = [
    sentBookmarked === null ? item.bookmarked : sentBookmarked === String(true),
    sentRead === null ? item.read : sentRead === String(true),
  ];

  if (item.id === 'clpfkrdwc0005zz3fsoc8xd3y') {
    console.log(bookmarked, sentBookmarked, fetcher.formData);
  }

  const ReadIcon = read ? SolidCheckIcon : CheckCircleIcon;
  const BookmarkIcon = bookmarked ? SolidBookmarkIcon : OutlineBookmarkIcon;

  const [playConfirm] = useSound(confirmSound, { volume: 0.1 });
  const [playCancel] = useSound(cancelSound, { volume: 0.1 });

  const description = React.useMemo(() => {
    return convert(item.description);
  }, [item.description]);

  return (
    <article
      id={item.id}
      className={`flex flex-col gap-1 border-b py-4 sm:rounded-lg sm:border-t-0 sm:p-4 sm:pt-4 sm:shadow-md`}
    >
      <span className="flex w-full justify-between">
        <Link to={channel.id} className="truncate pb-2 ">
          {props.query ? (
            <Highlight input={channel.title} query={props.query} />
          ) : (
            channel.title
          )}
        </Link>

        <fieldset className="flex gap-2">
          {[
            {
              name: ChannelItemDetail.form.names.read,
              value: String(!read),
              Icon: ReadIcon,
              title: !read ? 'Mark as read' : 'Mark as not read yet',
              className: 'hover:bg-green-200',
              playSubmit: read ? playCancel : playConfirm,
            },
            {
              name: ChannelItemDetail.form.names.bookmarked,
              value: String(!bookmarked),
              Icon: BookmarkIcon,

              title: !bookmarked
                ? 'Bookmark article'
                : 'Remove from bookmarked articles',
              className: 'hover:bg-yellow-100',
              playSubmit: bookmarked ? playCancel : playConfirm,
            },
          ].map((formItem) => (
            <fetcher.Form method={props.formMethod} key={formItem.name}>
              <RequiredFormData itemId={item.id} />
              <input
                type="hidden"
                name={formItem.name}
                value={formItem.value}
              />

              <button
                type="submit"
                title={formItem.title}
                className={'rounded p-1 '.concat(formItem.className)}
                data-silent
                aria-label={formItem.title}
                onClick={() => formItem.playSubmit()}
              >
                <formItem.Icon
                  className={`w-4  ${
                    formItem.value === 'false' ? 'text-black' : ''
                  } pointer-events-none ${formItem.className}`}
                />
              </button>
            </fetcher.Form>
          ))}
        </fieldset>
      </span>

      {item.imageUrl && (
        <a href={item.link} className="">
          <img
            alt="Article header decoration"
            src={item.imageUrl}
            className="my-2 h-auto w-full rounded-lg bg-slate-50 italic sm:rounded-none"
            loading="lazy"
            style={{ aspectRatio: '1.4' }}
          />
        </a>
      )}
      <h4>
        <Href
          href={item.link}
          className="bg-slate-100 text-lg text-slate-900 visited:bg-slate-100 visited:text-slate-600 [&:not(:visited)]:bg-white"
        >
          {props.query ? (
            <Highlight query={props.query} input={item.title} />
          ) : (
            item.title
          )}
        </Href>
      </h4>
      <span className="flex gap-1 text-slate-400">
        {item.author}
        <TimeFromNow date={new Date(item.pubDate)} />
      </span>
      <span className="my-1 flex gap-1 text-sm">
        <ChannelCategoryLinks category={channel.category} />
      </span>
      <p className="line-clamp-10">
        {props.query ? (
          <Highlight query={props.query} input={description.slice(0, 500)} />
        ) : (
          description
        )}
      </p>
    </article>
  );
}

ChannelItemDetail.form = {
  names: {
    itemId: 'itemId',
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

function RequiredFormData(props: { itemId: string }) {
  return (
    <>
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.itemId}
        value={props.itemId}
      />
    </>
  );
}

async function handleItemStatusUpdate({ formData }: { formData: FormData }) {
  const { names, getBooleanValue } = ChannelItemDetail.form;
  const itemId = formData.get(names.itemId);
  invariant(typeof itemId === 'string', 'Item id was not provided');

  const bookmarked = formData.get(names.bookmarked);
  const read = formData.get(names.read);

  await updateChannelItem({
    where: {
      id: itemId,
    },
    data: {
      read: getBooleanValue(read),
      bookmarked: getBooleanValue(bookmarked),
    },
  });

  return null;
}

ChannelItemDetail.handleAction = handleItemStatusUpdate;
