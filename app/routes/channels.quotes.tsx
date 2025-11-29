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
import { UseAppTitle } from "~/components/AppTitle";
import { MainSection } from "~/components/MainSection";

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
  const title = <UseAppTitle>{loaderData.title}</UseAppTitle>;
  if (!loaderData.quotes.length && !loaderData.search) {
    return (
      <MainSection className="flex flex-col gap-2 text-center text-lg font-bold">
        {title}
        {loaderData.quotes.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-16">
            <div>
              <p>Keep memorable quotes</p>
              <p className="mb-4 text-sm font-normal wrap-anywhere text-slate-500 dark:text-slate-300">
                Add a quote to any article from your{" "}
                <Link to="/channels" className="underline">
                  feed
                </Link>
              </p>
            </div>
            <img
              alt=""
              src="/reading-side.svg"
              data-from="https://www.opendoodles.com/"
              className="w-1/2 max-w-[30ch] dark:invert-[.7]"
            />
          </div>
        )}
      </MainSection>
    );
  }
  return (
    <MainSection>
      {title}
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
            className="flex flex-col overflow-hidden border-b border-dashed py-4 last:border-none dark:border-slate-800"
          >
            <Link
              to={`/channels/${quote.item.channel.id}`}
              className="text-slate-500 dark:text-slate-400"
            >
              {quote.item.channel.title}
            </Link>

            <p className="relative overflow-hidden py-2 text-lg wrap-anywhere text-ellipsis whitespace-break-spaces italic before:text-slate-500 before:content-['„']">
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
    </MainSection>
  );
}
