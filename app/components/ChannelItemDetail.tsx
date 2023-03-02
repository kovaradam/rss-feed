import {
  BookmarkIcon as OutlineBookmarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/outline';
import {
  BookmarkIcon as SolidBookmarkIcon,
  CheckCircleIcon as SolidCheckIcon,
} from '@heroicons/react/solid';
import type { FormProps } from '@remix-run/react';
import { Link } from '@remix-run/react';
import { useLocation } from '@remix-run/react';
import { Form } from '@remix-run/react';
import { redirect } from '@remix-run/server-runtime';
import invariant from 'tiny-invariant';
import useSound from 'use-sound';
import type { ItemWithChannel } from '~/models/channel.server';
import { updateChannelItem } from '~/models/channel.server';
import { ChannelCategoryLinks } from './ChannelCategories';
import { Href } from './Href';
import { TimeFromNow } from './TimeFromNow';
import confirmSound from 'public/sounds/state-change_confirm-up.wav';
import cancelSound from 'public/sounds/state-change_confirm-down.wav';

type Props = { item: ItemWithChannel; formMethod: FormProps['method'] };

export function ChannelItemDetail(props: Props): JSX.Element {
  const { channel, ...item } = props.item;
  const ReadIcon = item.read ? SolidCheckIcon : CheckCircleIcon;
  const BookmarkIcon = item.bookmarked
    ? SolidBookmarkIcon
    : OutlineBookmarkIcon;

  const [playConfirm] = useSound(confirmSound);
  const [playCancel] = useSound(cancelSound);

  return (
    <article
      className={`flex flex-col gap-1 border-b py-4 sm:rounded-lg sm:border-t-0 sm:p-4 sm:pt-4 sm:shadow-lg`}
    >
      <span className="flex w-full justify-between">
        <Link to={channel.id} className="truncate pb-2 ">
          {channel.title}
        </Link>
        <fieldset className="flex gap-2">
          {[
            {
              name: ChannelItemDetail.form.names.read,
              value: String(!item.read),
              Icon: ReadIcon,
              title: !item.read ? 'Mark as read' : 'Mark as not read yet',
              className: 'hover:bg-green-200',
              playSubmit: item.read ? playCancel : playConfirm,
            },
            {
              name: ChannelItemDetail.form.names.bookmarked,
              value: String(!item.bookmarked),
              Icon: BookmarkIcon,
              title: !item.bookmarked
                ? 'Bookmark article'
                : 'Remove from bookmarked articles',
              className: 'hover:bg-yellow-100',
              playSubmit: item.bookmarked ? playCancel : playConfirm,
            },
          ].map((formItems) => (
            <Form method={props.formMethod} key={formItems.name}>
              <RequiredFormData itemId={item.id} />
              <input
                type="hidden"
                name={formItems.name}
                value={formItems.value}
              />
              <button
                type="submit"
                title={formItems.title}
                className={'rounded p-1 '.concat(formItems.className)}
                data-silent
                onClick={() => formItems.playSubmit()}
              >
                <formItems.Icon
                  className={`w-4  ${
                    formItems.value === 'false' ? 'text-black' : ''
                  } pointer-events-none ${formItems.className}`}
                />
              </button>
            </Form>
          ))}
        </fieldset>
      </span>

      {item.imageUrl && (
        <a href={item.link}>
          <img
            alt="Article header decoration"
            src={item.imageUrl}
            className="my-2 h-auto w-full rounded-lg bg-slate-50 sm:rounded-none"
            loading="lazy"
            style={{ aspectRatio: '1.4' }}
          />
        </a>
      )}
      <h4>
        <Href href={item.link} className="text-lg text-gray-900 ">
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
    itemId: 'itemId',
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

function RequiredFormData(props: { itemId: string }) {
  const location = useLocation();

  return (
    <>
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.itemId}
        value={props.itemId}
      />
      <input
        type="hidden"
        name={ChannelItemDetail.form.names.redirectTo}
        value={location.pathname.concat(location.search)}
      />
    </>
  );
}

async function handleItemStatusUpdate({
  formData,
  request,
}: {
  formData: FormData;
  request: Request;
}) {
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

  return redirect(String(formData.get(names.redirectTo) ?? request.url));
}

ChannelItemDetail.handleAction = handleItemStatusUpdate;
