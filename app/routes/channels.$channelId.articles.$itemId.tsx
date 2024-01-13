import { ClockIcon, TrashIcon, UserIcon } from '@heroicons/react/outline';
import { useFetcher, useLoaderData } from '@remix-run/react';
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@remix-run/server-runtime';
import { convert } from 'html-to-text';
import React from 'react';
import invariant from 'tiny-invariant';
import { UseAppTitle } from '~/components/AppTitle';
import { SubmitButton } from '~/components/Button';
import { DescriptionList } from '~/components/DescriptionList';
import { Href } from '~/components/Href';
import { PageHeading } from '~/components/PageHeading';
import { TimeFromNow } from '~/components/TimeFromNow';
import { WithFormLabel } from '~/components/WithFormLabel';
import {
  addQuoteToItem,
  deleteQuote,
  getChannelItem,
  getQuotesByItem,
} from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createMeta } from '~/utils';

export const meta = createMeta();

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Invalid method', { status: 400 });
  }
  const itemId = params.itemId as string;
  const userId = await requireUserId(request);
  const form = await request.formData();

  const intent = form.get('intent');

  if (intent === 'delete') {
    const id = form.get('id');
    invariant(typeof id === 'string');
    await deleteQuote(id, userId);
    return new Response('ok', { status: 200 });
  }

  const quote = form.get('quote');

  if (!quote || typeof quote !== 'string') {
    return json({ quote: 'Please provide a quote content' });
  }

  const result = await addQuoteToItem(quote, { itemId, userId });

  return json({ quote: result.content });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const item = await getChannelItem(params.itemId as string, userId);
  const quotes = await getQuotesByItem(params.itemId as string, userId);

  if (!item) {
    throw new Response('Not found', { status: 404 });
  }

  return json({ item, title: item?.title, quotes });
}

export default function ItemDetailPage() {
  const data = useLoaderData<typeof loader>();
  const { item } = data;

  const fetcher = useFetcher();
  const submittedQuote = fetcher.formData?.get('quote');
  const quotes =
    typeof submittedQuote === 'string'
      ? [
          {
            content: submittedQuote,
            id: 'new',
            createdAt: new Date().toString(),
          },
        ].concat(data.quotes)
      : data.quotes;

  const description = React.useMemo(() => {
    return convert(item.description);
  }, [item.description]);

  return (
    <>
      <UseAppTitle>Article detail</UseAppTitle>
      <PageHeading>{item.title}</PageHeading>
      <DescriptionList className="py-2">
        {[
          {
            label: <></>,
            content: <Href href={item.link} />,
            id: 'link',
          },
          {
            label: (
              <>
                <UserIcon className="w-4" /> Author:
              </>
            ),
            content: item.author,
            id: 'author',
          },
          {
            label: (
              <>
                <ClockIcon className="w-4" /> Published:
              </>
            ),
            content: <TimeFromNow date={new Date(item.pubDate)} />,
            id: 'published',
          },
        ].map((entry) => (
          <span className="flex gap-1" key={entry.id}>
            <DescriptionList.Term className="flex items-center gap-1">
              {entry.label}
            </DescriptionList.Term>
            <DescriptionList.Detail>
              {entry.content || 'missing'}
            </DescriptionList.Detail>
          </span>
        ))}
        <span>
          <DescriptionList.Term className="flex items-center gap-1 pb-1 pt-2">
            Description:
          </DescriptionList.Term>
          <DescriptionList.Detail>
            <p className="dark:text-white">{description || 'missing'}</p>
          </DescriptionList.Detail>
        </span>
      </DescriptionList>
      <hr className="my-2" />
      <h4 className="py-2 text-2xl  font-bold dark:text-white sm:text-2xl">
        Quotes
      </h4>
      <fetcher.Form method="post">
        <WithFormLabel label="New quote">
          {({ htmlFor }) => (
            <div className="flex flex-col gap-2 md:flex-row">
              <textarea
                name="quote"
                id={htmlFor}
                className={styles.input}
                maxLength={1000}
              />
              <SubmitButton className="max-h-8 md:self-end">Add</SubmitButton>
            </div>
          )}
        </WithFormLabel>
      </fetcher.Form>

      <hr className="mt-2" />
      <ul>
        {quotes.map((quote) => (
          <Quote key={quote.id} {...quote} />
        ))}
      </ul>
    </>
  );
}

function Quote(props: { content: string; createdAt: string; id: string }) {
  const fetcher = useFetcher();
  if (fetcher.formData) {
    return null;
  }

  return (
    <li
      id={props.id}
      key={props.id}
      className="flex flex-col border-b border-dashed py-2  last:border-none"
    >
      <p className="italic dark:text-white">„{props.content}“</p>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <TimeFromNow date={new Date(props.createdAt)} />
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={props.id} />
          <button type="submit" aria-label="Delete quote">
            <TrashIcon className="w-4" />
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}
