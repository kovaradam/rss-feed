import {
  BookmarkIcon as OutlineBookmarkIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/outline';
import {
  EyeOffIcon,
  BookmarkIcon as SolidBookmarkIcon,
  CheckCircleIcon as SolidCheckIcon,
} from '@heroicons/react/solid';
import type { FormProps } from '@remix-run/react';
import { Link, useFetcher } from '@remix-run/react';
import useSound from '~/utils/use-sound';
import type { ItemWithChannel } from '~/models/channel.server';
import { ChannelCategoryLinks } from '../ChannelCategories';
import { Href } from '../Href';
import { TimeFromNow } from '../TimeFromNow';
import confirmSound from '/sounds/state-change_confirm-up.wav?url';
import cancelSound from '/sounds/state-change_confirm-down.wav?url';
import { Highlight } from '../Highlight';
import { convert } from 'html-to-text';
import React from 'react';
import { Tooltip } from '../Tooltip';

type Props = {
  item: ItemWithChannel;
  formMethod: FormProps['method'];
  query?: string;
  hideImage?: boolean;
  wrapperClassName?: string;
};

export function ChannelItemDetail(props: Props): JSX.Element {
  const { channel, ...item } = props.item;

  const fetcher = useFetcher();
  const [sentBookmarked, sentRead, sentHiddenFromFeed] = [
    fetcher.formData?.get(ChannelItemDetail.form.names.bookmarked) ?? null,
    fetcher.formData?.get(ChannelItemDetail.form.names.read) ?? null,
    fetcher.formData?.get(ChannelItemDetail.form.names.hiddenFromFeed) ?? null,
  ];

  const [bookmarked, read, hiddenFromFeed] = [
    sentBookmarked === null ? item.bookmarked : sentBookmarked === String(true),
    sentRead === null ? item.read : sentRead === String(true),
    sentHiddenFromFeed === null
      ? item.hiddenFromFeed
      : sentHiddenFromFeed === String(true),
  ];

  const ReadIcon = read ? SolidCheckIcon : CheckCircleIcon;
  const BookmarkIcon = bookmarked ? SolidBookmarkIcon : OutlineBookmarkIcon;
  const HiddenFromFeedIcon = hiddenFromFeed ? EyeOffIcon : EyeIcon;

  const [playConfirm] = useSound(confirmSound, { volume: 0.1 });
  const [playCancel] = useSound(cancelSound, { volume: 0.1 });

  const description = React.useMemo(() => {
    return convert(item.description);
  }, [item.description]);

  const itemTitle = ChannelItemDetail.Title({ description, title: item.title });

  return (
    <article
      id={item.id}
      className={`relative flex flex-col gap-1 border-b py-4 sm:rounded-lg sm:bg-white sm:p-4 sm:pt-4 sm:shadow-md dark:border-b-slate-600 dark:sm:border-none dark:sm:border-b-slate-600 dark:sm:bg-slate-800 dark:sm:shadow-none ${props.wrapperClassName}`}
    >
      <span className="flex w-full justify-between gap-2 dark:text-white">
        <Link
          to={`/channels/${channel.id}`}
          className="max-w-[60vw] truncate sm:max-w-[40ch]"
        >
          {props.query ? (
            <Highlight input={channel.title} query={props.query} />
          ) : (
            channel.title
          )}
        </Link>

        <fieldset className="flex gap-2">
          {[
            {
              name: ChannelItemDetail.form.names.hiddenFromFeed,
              value: String(!hiddenFromFeed),
              Icon: HiddenFromFeedIcon,
              title: hiddenFromFeed ? 'Show in feed' : 'Hide in feed',
              className: `${
                hiddenFromFeed ? 'hover:bg-green-200' : 'hover:bg-red-200'
              } dark:hover:bg-slate-900`,
              playSubmit: hiddenFromFeed ? playConfirm : playCancel,
            },
            {
              name: ChannelItemDetail.form.names.read,
              value: String(!read),
              Icon: ReadIcon,
              title: !read ? 'Mark as read' : 'Mark as not read yet',
              className: 'hover:bg-green-200 dark:hover:bg-slate-900',
              playSubmit: read ? playCancel : playConfirm,
            },
            {
              name: ChannelItemDetail.form.names.bookmarked,
              value: String(!bookmarked),
              Icon: BookmarkIcon,

              title: !bookmarked
                ? 'Bookmark article'
                : 'Remove from bookmarked articles',
              className: 'hover:bg-yellow-100 dark:hover:bg-slate-900',
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
                className={'relative rounded p-1 '.concat(formItem.className)}
                data-silent
                aria-label={formItem.title}
                onClick={() => formItem.playSubmit()}
              >
                <formItem.Icon
                  className={`w-4  ${
                    formItem.value === 'false'
                      ? 'text-black dark:text-white'
                      : ''
                  } pointer-events-none ${formItem.className}`}
                />
                <Tooltip>{formItem.title}</Tooltip>
              </button>
            </fetcher.Form>
          ))}
        </fieldset>
      </span>

      <Href
        href={item.link}
        className="mt-2 text-lg text-slate-900 visited:text-violet-900 dark:text-white dark:visited:text-violet-200"
      >
        {item.imageUrl && !props.hideImage && (
          <img
            alt=""
            src={item.imageUrl}
            className="mb-2 aspect-[1.4] h-auto w-full rounded-lg bg-slate-50 text-sm italic sm:rounded-none dark:bg-slate-950"
            loading="lazy"
          />
        )}
        {props.query ? (
          <Highlight query={props.query} input={itemTitle as string} />
        ) : (
          itemTitle
        )}
      </Href>
      <span className="flex gap-1 text-slate-500 dark:text-slate-400">
        {item.author}
        <TimeFromNow date={new Date(item.pubDate)} />
      </span>
      <span className="my-1 flex gap-1 text-sm">
        <ChannelCategoryLinks category={channel.category} />
      </span>
      <p className="line-clamp-10 [overflow-wrap:anywhere] dark:text-white">
        {props.query ? (
          <Highlight query={props.query} input={description.slice(0, 500)} />
        ) : (
          description
        )}
      </p>
      <Link
        to={`/channels/${channel.id}/articles/${item.id}`}
        className="pt-1 text-slate-500 dark:text-slate-400"
      >
        See details
      </Link>
    </article>
  );
}

ChannelItemDetail.form = {
  names: {
    itemId: 'itemId',
    bookmarked: 'bookmarked',
    read: 'read',
    hiddenFromFeed: 'hiddenFromFeed',
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

ChannelItemDetail.Title = function ChannelItemDetailTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}): string {
  return React.useMemo(() => {
    if (title) {
      return title;
    }
    const result = convert(description.slice(0, 30));
    return result.slice(0, result.lastIndexOf(' ')).concat(' ...');
  }, [description, title]);
};
