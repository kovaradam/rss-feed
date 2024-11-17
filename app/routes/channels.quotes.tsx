import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { ChannelItemsOverlay } from '~/components/ArticleOverlay';
import { ChannelItemDetail } from '~/components/ChannelItemDetail/ChannelItemDetail';
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
  let [search, countParam] = [PageSearchInput.names.search, countParamName].map(
    (key) => new URL(request.url).searchParams.get(key)
  );
  search = typeof search === 'string' ? search : null;
  const count =
    !countParam || isNaN(Number(countParam)) ? 30 : Number(countParam);

  const [quotes, totalCount] = await getQuotesByUser(userId, {
    query: search,
    count,
  });

  return {
    title: 'Your quotes',
    quotes,
    search,
    cursor:
      totalCount > count
        ? { name: countParamName, value: String(count + 10) }
        : null,
  };
}

export default function QuotesPage() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (!data.quotes.length && !data.search) {
    return (
      <div className="flex flex-col gap-2 text-center text-lg font-bold ">
        {data.quotes.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-16">
            <div>
              <p className="dark:text-white">
                Store memorable quotes from articles
              </p>
              <p className="mb-4 font-normal text-slate-500 [overflow-wrap:anywhere] dark:text-slate-300">
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
          defaultValue={data.search ?? ''}
        />
      </Form>
      <ul className="relative">
        {navigation.formData && navigation.state === 'loading' && (
          <ChannelItemsOverlay />
        )}
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

            <p className="relative  overflow-hidden text-ellipsis whitespace-break-spaces py-2 text-lg italic [overflow-wrap:anywhere] before:text-slate-500 before:content-['„'] dark:text-white">
              <Highlight
                input={quote.content.trim()}
                query={data.search ?? ''}
              />
              <span className="text-slate-500">“</span>
            </p>

            <div className="flex justify-end text-slate-500 dark:text-slate-400">
              <Link
                to={`/channels/${quote.item.channel.id}/articles/${quote.itemId}`}
              >
                ~{' '}
                <ChannelItemDetail.Title
                  title={quote.item.title}
                  description={quote.item.title}
                />
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {data.cursor && (
        <ShowMoreLink
          cursor={data.cursor}
          otherValues={[
            {
              name: PageSearchInput.names.search,
              value: data.search ?? '',
            },
          ]}
        />
      )}
    </div>
  );
}
