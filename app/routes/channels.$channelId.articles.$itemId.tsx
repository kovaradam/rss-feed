import {
  ChatIcon,
  ChevronLeftIcon,
  ClockIcon,
  RssIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/outline";
import { Link, useFetcher } from "react-router";
import React from "react";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";
import { SubmitButton } from "~/components/Button";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { DescriptionList } from "~/components/DescriptionList";
import { Href } from "~/components/Href";
import { PageHeading } from "~/components/PageHeading";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import { TimeFromNow } from "~/components/TimeFromNow";
import { WithFormLabel } from "~/components/WithFormLabel";
import {
  addQuoteToItem,
  deleteQuote,
  getChannelItem,
  getQuotesByItem,
} from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { styles } from "~/styles/shared";
import { createMeta, enumerate } from "~/utils";
import type { Route } from "./+types/channels.$channelId.articles.$itemId";
import { BackLink } from "~/components/BackLink";
import { ChannelItemDetailService } from "~/components/ChannelItemDetail/ChannelItemDetail.server";
import { List } from "~/components/List";

export const meta = createMeta();

const inputs = enumerate(["action", "quote", "id"]);

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Invalid method", { status: 400 });
  }

  const itemId = params.itemId as string;
  const userId = await requireUserId(request);
  const formData = await request.formData();

  if (ChannelItemDetailService.isChannelItemUpdate(formData)) {
    return ChannelItemDetailService.handleAction(userId, formData);
  }

  if (formData.get(inputs["action"]) === "delete") {
    const id = formData.get(inputs["id"]);
    invariant(typeof id === "string");
    await deleteQuote(id, userId);
    return new Response("ok", { status: 200 });
  }

  const quote = formData.get(inputs["quote"]);

  if (!quote || typeof quote !== "string") {
    return { error: "Please provide a quote content" };
  }

  const result = await addQuoteToItem(quote, { itemId, userId });

  return { quote: result.content };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const item = await getChannelItem(params.itemId as string, userId);
  const countParam = new URL(request.url).searchParams.get("count");
  const quoteCount =
    !countParam || isNaN(Number(countParam)) ? 30 : Number(countParam);

  const [quotes, totalQuoteCount] = await getQuotesByItem(
    params.itemId as string,
    userId,
    {
      count: quoteCount,
    },
  );

  if (!item) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    item,
    title: item?.title,
    quotes,
    cursor:
      quotes.length < totalQuoteCount
        ? { name: "count", value: String(quotes.length + 10) }
        : null,
  };
}

export default function ItemDetailPage({ loaderData }: Route.ComponentProps) {
  const { item } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const submittedQuote = fetcher.formData?.get("quote");
  const quotes =
    typeof submittedQuote === "string"
      ? [
          {
            content: submittedQuote,
            id: "new",
            createdAt: new Date(),
          },
        ].concat(loaderData.quotes)
      : loaderData.quotes;

  const description = item.description;

  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <div style={{ viewTransitionName: `${item.id}` }}>
      <UseAppTitle>Article detail</UseAppTitle>

      <BackLink
        className="mb-4 flex  gap-1 text-slate-500 dark:text-slate-400 hover:underline"
        to={`/channels/${item.channelId}`}
      >
        {(backEntry) => (
          <>
            <ChevronLeftIcon className="h-[2.9ex] w-4 min-w-4 " />
            {backEntry?.title ?? item.channel.title}
          </>
        )}
      </BackLink>

      <div className="flex flex-col justify-between md:flex-row">
        <PageHeading>
          <ChannelItemDetail.Title
            title={item.title}
            description={item.description}
          />
        </PageHeading>
        <ChannelItemDetail.Actions item={item} />
      </div>
      <DescriptionList className={`py-2`}>
        {[
          {
            label: "Link",
            visuallyHidden: true,
            content: <Href href={item.link} className={`break-all`} />,
            id: "link",
          },
          {
            label: (
              <>
                <RssIcon className="w-4" /> Channel:
              </>
            ),
            content: (
              <Link to={`/channels/${item.channel.id}`} className="underline">
                {item.channel.title}
              </Link>
            ),
            id: "channel",
          },
          {
            label: (
              <>
                <UserIcon className="w-4" /> Author:
              </>
            ),
            content: item.author,
            id: "author",
          },
          {
            label: (
              <>
                <ClockIcon className="w-4" /> Published:
              </>
            ),
            content: <TimeFromNow date={item.pubDate} />,
            id: "published",
          },
          {
            label: (
              <>
                <ChatIcon className="w-4" /> Comments:
              </>
            ),
            content: <Href href={item.comments} className={`break-all`} />,
            id: "comments",
            hidden: !item.comments,
          },
        ].map(
          (entry) =>
            !entry.hidden && (
              <span className="flex items-start gap-1" key={entry.id}>
                <DescriptionList.Term
                  className="flex items-center gap-1"
                  visuallyHidden={
                    entry.visuallyHidden === true ? true : undefined
                  }
                >
                  {entry.label}
                </DescriptionList.Term>
                <DescriptionList.Definition>
                  {entry.content || "missing"}
                </DescriptionList.Definition>
              </span>
            ),
        )}
        <span>
          <DescriptionList.Term className="flex items-center gap-1 pb-1 pt-2">
            Description:
          </DescriptionList.Term>
          <DescriptionList.Definition>
            <p className="text-slate-950 wrap-anywhere dark:text-white">
              {description || "missing"}
            </p>
          </DescriptionList.Definition>
        </span>
      </DescriptionList>
      <hr className="my-2" />
      <h4 className="py-2 text-2xl  font-bold sm:text-2xl dark:text-white">
        Quotes
      </h4>
      <fetcher.Form
        method="post"
        onSubmit={() => setTimeout(() => formRef.current?.reset())}
        ref={formRef}
      >
        <WithFormLabel label="New quote">
          {({ htmlFor }) => (
            <div className="flex flex-col gap-2 md:flex-row">
              <textarea
                name={inputs["quote"]}
                required
                id={htmlFor}
                className={styles.input}
                maxLength={1000}
              />
              <SubmitButton className="max-h-8 md:self-end">Add</SubmitButton>
            </div>
          )}
        </WithFormLabel>
        {fetcher.data && "error" in fetcher.data && (
          <p className="text-red-700">{fetcher.data?.error}</p>
        )}
      </fetcher.Form>
      <hr className="my-2 mt-4" />
      <List>
        {quotes.map((quote) => (
          <Quote
            key={quote.id}
            content={quote.content}
            createdAt={quote.createdAt}
            id={quote.id}
          />
        ))}
      </List>
      {loaderData.cursor && <ShowMoreLink cursor={loaderData.cursor} />}
    </div>
  );
}

function Quote(props: { content: string; createdAt: Date; id: string }) {
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
      <p className="overflow-hidden text-ellipsis italic wrap-anywhere dark:text-white">
        „{props.content}“
      </p>

      <div className="flex justify-between text-slate-500 dark:text-slate-400">
        <TimeFromNow date={props.createdAt} />
        <fetcher.Form method="post">
          <input type="hidden" name={inputs["id"]} value={props.id} />
          <button
            type="submit"
            aria-label="Delete quote"
            name={inputs["action"]}
            value="delete"
          >
            <TrashIcon className="pointer-events-none w-4" />
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}
