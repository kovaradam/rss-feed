import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { ChannelItemsOverlay } from '~/components/ArticleOverlay';
import { Highlight } from '~/components/Highlight';
import { PageSearchInput } from '~/components/PageSearchInput';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import { getQuotesByUser } from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { createMeta } from '~/utils';

export const meta = createMeta();

const countParamName = 'count';
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  let [q, countParam] = ['q', countParamName].map((key) =>
    new URL(request.url).searchParams.get(key)
  );
  q = typeof q === 'string' ? q : null;
  const count =
    !countParam || isNaN(Number(countParam)) ? 30 : Number(countParam);

  const [quotes, totalCount] = await getQuotesByUser(userId, {
    query: q,
    count,
  });

  return json({
    title: 'Your quotes',
    quotes,
    q,
    cursor:
      totalCount > count
        ? { name: countParamName, value: String(count + 10) }
        : null,
  });
}

export default function QuotesPage() {
  const data = useLoaderData<typeof loader>();
  const { state } = useNavigation();

  if (!data.quotes.length && !data.q) {
    return (
      <div className="flex flex-col gap-2 text-center text-lg font-bold ">
        {data.quotes.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-16">
            <div>
              <p className="dark:text-white">
                Store memorable quotes from articles
              </p>
              <p className="mb-4 font-normal text-slate-500 dark:text-slate-300">
                Add a quote to any article from your{' '}
                <Link to="/channels" className="underline">
                  feed
                </Link>
              </p>
            </div>
            <img
              alt="Illustration doodle of a person sitting and reading"
              src="/reading-side.svg"
              width={'50%'}
              data-from="https://www.opendoodles.com/"
              className="dark:invert-[.7]"
            />
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <Form id="search">
        <PageSearchInput
          placeholder="Search in quotes"
          formId="search"
          defaultValue={data.q ?? ''}
        />
      </Form>
      <ul className="relative">
        {state === 'loading' && <ChannelItemsOverlay />}
        {data.quotes.map((quote) => (
          <li
            id={quote.id}
            key={quote.id}
            className="flex flex-col overflow-hidden border-b border-dashed  py-4 last:border-none"
          >
            <Link
              to={`/channels/${quote.item.channel.id}`}
              className="text-slate-500 dark:text-slate-400"
            >
              {quote.item.channel.title}
            </Link>

            <p className="relative max-w-[90vw] overflow-hidden text-ellipsis whitespace-break-spaces py-2 text-lg italic before:text-slate-500 before:content-['„'] sm:max-w-[60ch]  dark:text-white">
              <Highlight input={quote.content.trim()} query={data.q ?? ''} />
              <span className="text-slate-500">“</span>
            </p>

            <div className="flex justify-end text-slate-500 dark:text-slate-400">
              <Link
                to={`/channels/${quote.item.channel.id}/articles/${quote.itemId}`}
              >
                ~ {quote.item.title}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {data.cursor && (
        <ShowMoreLink
          cursor={data.cursor}
          otherValues={[{ name: 'q', value: data.q ?? '' }]}
        />
      )}
    </div>
  );
}
