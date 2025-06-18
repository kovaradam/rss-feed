import { Form, Link } from "react-router";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { Highlight } from "~/components/Highlight";
import { PageSearchInput } from "~/components/PageSearchInput";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import { getQuotesByUser } from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { createMeta } from "~/utils";
import type { Route } from "./+types/channels.quotes";
import { List } from "~/components/List";

export const meta = createMeta();

const countParamName = "count";
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  let search = url.searchParams.get(PageSearchInput.names.search);
  search = typeof search === "string" ? search : null;

  const countParam = url.searchParams.get(countParamName);

  const count =
    !countParam || isNaN(Number(countParam)) ? 30 : Number(countParam);

  const [quotes, totalCount] = await getQuotesByUser(userId, {
    query: search,
    count,
  });

  return {
    title: "Your quotes",
    quotes,
    search,
    cursor:
      totalCount > count
        ? { name: countParamName, value: String(count + 10) }
        : null,
  };
}

export default function QuotesPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.quotes.length && !loaderData.search) {
    return (
      <div className="flex flex-col gap-2 text-center text-lg font-bold ">
        {loaderData.quotes.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-16">
            <div>
              <p className="dark:text-white">
                Store memorable quotes from articles
              </p>
              <p className="mb-4 font-normal text-slate-500 [overflow-wrap:anywhere] dark:text-slate-300">
                Add a quote to any article from your{" "}
                <Link to="/channels" className="underline">
                  feed
                </Link>
              </p>
            </div>
            <img
              alt=""
              src="/reading-side.svg"
              width={"50%"}
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
          defaultValue={loaderData.search ?? ""}
        />
      </Form>
      <List className="relative">
        {loaderData.quotes.map((quote) => (
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
                query={loaderData.search ?? ""}
              />
              <span className="text-slate-500">“</span>
            </p>

            <div className="flex justify-end text-slate-500 dark:text-slate-400">
              <Link
                to={`/channels/${quote.item.channel.id}/articles/${quote.itemId}`}
              >
                ~{" "}
                <ChannelItemDetail.Title
                  title={quote.item.title}
                  description={quote.item.title}
                />
              </Link>
            </div>
          </li>
        ))}
      </List>
      {loaderData.cursor && (
        <ShowMoreLink
          cursor={loaderData.cursor}
          otherValues={[
            {
              name: PageSearchInput.names.search,
              value: loaderData.search ?? "",
            },
          ]}
        />
      )}
    </div>
  );
}
