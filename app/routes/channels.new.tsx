import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import { Form, Link, useNavigation, redirect, href } from "react-router";
import React from "react";
import { UseAppTitle } from "~/components/AppTitle";
import { PageHeading } from "~/components/PageHeading";
import { SubmitSection } from "~/components/SubmitSection";
import { WithFormLabel } from "~/components/WithFormLabel";
import { createChannelFromXml, getChannels } from "~/models/channel.server";
import { storeFailedUpload } from "~/models/failed-upload.server";
import { requireUserId } from "~/session.server";
import { styles } from "~/styles/shared";
import { createTitle, enumerate, isSubmitting } from "~/utils";
import { mapValue } from "~/utils/map-value";
import type { Route } from "./+types/channels.new";
import { getChannelsFromUrl } from "~/models/parsers/get-channels-from-url";
import invariant from "tiny-invariant";
import { Href } from "~/components/Href";
import { FormButton } from "~/components/Button";
import { HiddenInputs } from "~/components/HiddenInputs";
import { ChannelErrors } from "~/models/utils.server";

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: createTitle(data?.title ?? ""),
    },
  ];
};

const inputs = enumerate(["channel-url", "parent-url"]);

type ErrorTypes = keyof typeof inputs | "xml-parse" | "create" | "fetch";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const channelUrlParam = new URL(request.url).searchParams.get(
    inputs["channel-url"]
  );
  return {
    title: "Add new channel",
    channelUrlParam: channelUrlParam ? String(channelUrlParam) : null,
  };
};

type ActionResponse =
  | {
      errors: Partial<Record<ErrorTypes, string>>;
    }
  | {
      feeds: Array<{
        href: string;
        title: string;
        description?: string;
        channelId?: string;
      }>;
      inputUrl: URL;
    };

export const action = async ({
  request,
}: Route.ActionArgs): Promise<ActionResponse> => {
  const formData = await request.formData();
  const inputChannelUrl = formData.get(inputs["channel-url"]);
  const userId = await requireUserId(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(inputChannelUrl));
  } catch (_) {
    return {
      errors: {
        [inputs["channel-url"]]: "Please provide a valid url",
      },
    };
  }

  let channelResponse: Awaited<ReturnType<typeof getChannelsFromUrl>>;

  try {
    channelResponse = await getChannelsFromUrl(channelUrl, request.signal);
    invariant(channelResponse?.length);
  } catch (_) {
    return {
      errors: {
        fetch: `Could not load any RSS feed from "${channelUrl.origin}"`,
      },
    };
  }

  const singleFeedResponse =
    channelResponse.length === 1 ? channelResponse[0] : null;

  const parentUrl = mapValue(formData.get(inputs["parent-url"]))((input) => {
    try {
      return new URL(input?.toString() ?? "");
    } catch {
      return null;
    }
  });

  if (singleFeedResponse) {
    let newChannel;
    try {
      newChannel = await createChannelFromXml(
        singleFeedResponse.feedXml,
        {
          userId,
          channelHref: singleFeedResponse.url.href,
        },
        request.signal
      );
    } catch (error) {
      let errorResponse;
      let isErrorToStore = true;

      switch (true) {
        case error instanceof ChannelErrors.channelExists:
          errorResponse = {
            create: `RSS feed with this address already exists, see channel [${error.channel.title}](/channels/${error.channel.id})`,
          };
          isErrorToStore = false;
          break;
        case error instanceof ChannelErrors.dbUnavailible:
          errorResponse = {
            create: "Cannot save RSS feed at this moment, please try later",
          };
          break;
        case error instanceof ChannelErrors.incorrectDefinition:
          errorResponse = {
            "xml-parse":
              "Could not parse RSS definition, please make sure you provided a correct URL",
          };
          break;
        default:
          errorResponse = {
            create: "Could not save RSS feed, please try later",
          };
      }

      if (isErrorToStore) {
        storeFailedUpload(String(inputChannelUrl), String(error));
      }

      return { errors: errorResponse };
    }

    if (parentUrl) {
      channelResponse =
        (await getChannelsFromUrl(parentUrl, request.signal)) ?? [];
    } else {
      throw redirect(
        href("/channels/:channelId", { channelId: newChannel.id })
      );
    }
  }

  const userChannels = (
    await getChannels(userId, {
      select: { id: true, feedUrl: true },
    })
  ).map((channel) => ({ url: new URL(channel.feedUrl), id: channel.id }));

  const feeds = channelResponse?.map((foundChannel) => ({
    channelId: userChannels.find(
      (userChannel) => foundChannel.url.href === userChannel.url.href
    )?.id,
    href: foundChannel.url.href,
    title: foundChannel.content.title,
    description: foundChannel.content.description,
  }));

  return {
    inputUrl: parentUrl ?? channelUrl,
    feeds: feeds.sort((a, b) => (a.title > b.title ? 1 : -1)),
  };
};

export default function NewChannelPage({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSaving = isSubmitting(navigation);

  const feedsResponse = actionData && "feeds" in actionData ? actionData : null;

  return (
    <>
      <UseAppTitle default />
      <PageHeading>{loaderData.title}</PageHeading>
      <div className="flex max-w-xl flex-col gap-4">
        <Form method={"POST"} className={"flex flex-col gap-4"}>
          <WithFormLabel htmlFor="new-channel-input" label="Channel address">
            <input
              type="url"
              name={inputs["channel-url"]}
              id="new-channel-input"
              required
              placeholder="https://www.example-web.com/"
              className={`${styles.input} `}
              aria-invalid="false"
              defaultValue={loaderData.channelUrlParam ?? ""}
            />
            {actionData && "errors" in actionData ? (
              Object.entries(actionData.errors).map(([type, error]) => (
                <span
                  key={type}
                  className="mt-1 flex w-fit items-center gap-1 rounded bg-red-100 p-1 px-2 pt-1 text-red-700"
                  id={type}
                >
                  <ExclamationCircleIcon className="min-w-[2ch] max-w-[2ch]" />
                  <span>
                    <TextWithLink text={error} />
                  </span>
                </span>
              ))
            ) : (
              <span className="pt-1 text-slate-500 dark:text-slate-400">
                Provide an address of an RSS channel or a web page
              </span>
            )}
          </WithFormLabel>
          <SubmitSection
            isSubmitting={
              isSaving && !navigation.formData?.get(inputs["parent-url"])
            }
            cancelProps={{ to: "/channels", scriptOnly: true }}
            submitProps={{ children: "Add channel" }}
          />
        </Form>
        {feedsResponse && (
          <>
            <h4 className="text-lg font-bold">
              There are multiple channels available from{" "}
              <Href href={feedsResponse.inputUrl.href} className="">
                {feedsResponse.inputUrl.hostname}
              </Href>
              :
            </h4>
            <ul>
              {feedsResponse.feeds.map((channel) => (
                <li
                  key={channel.href}
                  className="mb-4 rounded-lg bg-white p-4  shadow"
                >
                  <div className="flex justify-between ">
                    <div>
                      <h6 className="font-bold">{channel.title}</h6>
                      <Href href={channel.href}>{channel.href}</Href>
                    </div>
                    {channel.channelId ? (
                      <Link
                        to={href("/channels/:channelId", {
                          channelId: channel.channelId,
                        })}
                        className="flex h-fit gap-1 text-slate-700 hover:underline"
                      >
                        <CheckCircleIcon className="w-4 min-w-4" />
                        Saved
                      </Link>
                    ) : (
                      <Form method={"POST"}>
                        <HiddenInputs
                          inputs={{
                            [inputs["channel-url"]]: channel.href,
                            [inputs["parent-url"]]: feedsResponse.inputUrl.href,
                          }}
                        />
                        <FormButton
                          isPending={
                            navigation.formData?.get(inputs["channel-url"]) ===
                            channel.href
                          }
                          className="h-fit rounded border-current bg-rose-100 p-1 px-2 text-rose-700 hover:bg-rose-200 active:bg-rose-50 disabled:pointer-events-none"
                        >
                          <div className="flex items-center gap-1">
                            <PlusIcon className="w-4 min-w-4" />
                            Add
                          </div>
                        </FormButton>
                      </Form>
                    )}
                  </div>
                  <p className="mt-2 text-slate-700 empty:mt-0">
                    {channel.description}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function TextWithLink(props: { text: string }) {
  const links = props.text.match(linkRegExp);

  if (!links?.length) {
    return props.text;
  }

  const linkElements = (
    links.map((link) => link.slice(1, -1).split("](")) as Array<
      [label: string, to: string]
    >
  ).map(([label, to]) => ({ label, to }));

  return (
    <>
      {props.text.split(linkRegExp).map((slice, index) => (
        <React.Fragment key={slice}>
          {slice}
          {mapValue(linkElements[index])(
            (props) =>
              props && (
                <Link to={props.to} className="underline">
                  {props.label}
                </Link>
              )
          )}
        </React.Fragment>
      ))}
    </>
  );
}

const linkRegExp = /\[.*\]\(.*\)/;
