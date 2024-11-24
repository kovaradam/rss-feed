import { ExclamationCircleIcon } from '@heroicons/react/outline';
import { Form, Link, useNavigation, redirect, data } from 'react-router';
import React from 'react';
import { UseAppTitle } from '~/components/AppTitle';
import { PageHeading } from '~/components/PageHeading';
import { SubmitSection } from '~/components/SubmitSection';
import { WithFormLabel } from '~/components/WithFormLabel';
import {
  ChannelExistsError,
  IncorrectDefinitionError,
  UnavailableDbError,
  createChannelFromXml,
} from '~/models/channel.server';
import { storeFailedUpload } from '~/models/failed-upload.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, isSubmitting } from '~/utils';
import { mapValue } from '~/utils/map-value';
import type { Route } from './+types/channels.new';

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: createTitle(data?.title ?? ''),
    },
  ];
};

const inputNames = ['channel-url'] as const;
const [channelUrlName] = inputNames;
const _errors = [...inputNames, 'xml-parse', 'create', 'fetch'] as const;

export const loader = async ({ request }: Route.LoaderArgs) => {
  const channelUrlParam = new URL(request.url).searchParams.get(channelUrlName);
  return {
    title: 'Add new channel',
    channelUrlParam: channelUrlParam ? String(channelUrlParam) : null,
  };
};

type ActionData =
  | Partial<Record<(typeof _errors)[number], string | null>>
  | undefined
  | { newItemCount: number };

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const inputChannelHref = formData.get(channelUrlName);
  const userId = await requireUserId(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(inputChannelHref));
  } catch (_) {
    return data<ActionData>({
      [channelUrlName]: 'Please provide a valid url',
    });
  }

  let channelRequest;
  try {
    channelRequest = await fetch(channelUrl);
  } catch (_) {
    return data<ActionData>({
      fetch: `Could not load RSS feed from "${channelUrl.origin}"`,
    });
  }

  const channelXml = await channelRequest.text();
  let newChannel;
  try {
    newChannel = await createChannelFromXml(
      channelXml,
      {
        userId,
        channelHref: channelUrl.href,
      },
      request.signal
    );
  } catch (error) {
    let response: ActionData;

    switch (true) {
      case error instanceof ChannelExistsError:
        response = {
          create: `RSS feed with this address already exists, see channel [${error.channel.title}](/channels/${error.channel.id})`,
        };
        break;
      case error instanceof UnavailableDbError:
        response = {
          create: 'Cannot save RSS feed at this moment, please try later',
        };
        break;
      case error instanceof IncorrectDefinitionError:
        response = {
          'xml-parse':
            'Could not parse RSS definition, please make sure you provided a correct URL',
        };
        break;
      default:
        response = { create: 'Could not save RSS feed, please try later' };
    }

    storeFailedUpload(String(inputChannelHref), String(error));

    return response;
  }

  throw redirect('/channels/'.concat(newChannel.id));
};

export default function NewChannelPage({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const transition = useNavigation();
  const isSaving = isSubmitting(transition);

  return (
    <>
      <UseAppTitle default />
      <PageHeading>{loaderData.title}</PageHeading>
      <Form method={'PUT'} className={'flex max-w-xl flex-col gap-4'}>
        <WithFormLabel htmlFor="new-channel-input" label="RSS feed address">
          <input
            type="url"
            name={channelUrlName}
            id="new-channel-input"
            required
            placeholder="https://www.example-web.com/rss.xml"
            className={`${styles.input} `}
            aria-invalid="false"
            defaultValue={loaderData.channelUrlParam ?? ''}
          />
          {actionData ? (
            Object.entries(actionData).map(([type, error]) => (
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
              Provide a URL of a RSS feed you wish to add
            </span>
          )}
        </WithFormLabel>
        <SubmitSection
          isSubmitting={isSaving}
          cancelProps={{ to: '/channels' }}
          submitProps={{ children: 'Add channel' }}
        />
      </Form>
    </>
  );
}

function TextWithLink(props: { text: string }) {
  const links = props.text.match(linkRegExp);

  if (!links?.length) {
    return props.text;
  }

  const linkElements = (
    links.map((link) => link.slice(1, -1).split('](')) as Array<
      [label: string, to: string]
    >
  ).map(([label, to]) => ({ label, to }));

  props.text.split(linkRegExp).map(console.log);

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
