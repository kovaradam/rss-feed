import { ExclamationCircleIcon } from '@heroicons/react/outline';
import type { MetaFunction } from '@remix-run/react';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from '@remix-run/server-runtime';
import { redirect, json } from '@remix-run/server-runtime';
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
import { requireUser } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, isSubmitting } from '~/utils';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: createTitle(data?.title ?? ''),
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const channelUrlParam = new URL(request.url).searchParams.get(channelUrlName);
  return json({
    title: 'Add new channel',
    channelUrlParam: channelUrlParam ? String(channelUrlParam) : null,
  });
};

const inputNames = ['channel-url'] as const;
const [channelUrlName] = inputNames;
const errors = [...inputNames, 'xml-parse', 'create', 'fetch'] as const;

type ActionData =
  | Partial<Record<(typeof errors)[number], string | null>>
  | undefined
  | { newItemCount: number };

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.formData();
  const inputChannelHref = data.get(channelUrlName);
  const user = await requireUser(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(inputChannelHref));
  } catch (error) {
    return json<ActionData>({
      [channelUrlName]: 'Please provide a valid url',
    });
  }

  let channelRequest;
  try {
    channelRequest = await fetch(channelUrl);
  } catch (error) {
    return json<ActionData>({
      fetch: `Could not load RSS feed from "${channelUrl.origin}"`,
    });
  }

  const channelXml = await channelRequest.text();
  let newChannel;
  try {
    newChannel = await createChannelFromXml(
      channelXml,
      {
        userId: user.id,
        channelHref: channelUrl.href,
      },
      request.signal
    );
  } catch (error) {
    let response: ActionData;

    switch (true) {
      case error instanceof ChannelExistsError:
        response = {
          create: `RSS feed with this address already exists, see channel "${
            (error as ChannelExistsError).channel.title
          }"`,
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

    return json<ActionData>(response);
  }

  return redirect('/channels/'.concat(newChannel.id));
};

export default function NewChannelPage() {
  const errors = useActionData<typeof action>();
  const { title, channelUrlParam } = useLoaderData<typeof loader>();
  const transition = useNavigation();
  const isSaving = isSubmitting(transition);

  return (
    <>
      <UseAppTitle default />
      <PageHeading>{title}</PageHeading>
      <Form
        method={NewChannelPage.formMethod}
        className={'flex max-w-xl flex-col gap-4'}
      >
        <WithFormLabel htmlFor="new-channel-input" label="RSS feed address">
          <input
            type="url"
            name={channelUrlName}
            id="new-channel-input"
            autoFocus
            required
            placeholder="https://www.example-web.com/rss.xml"
            className={`${styles.input} `}
            aria-invalid="false"
            defaultValue={channelUrlParam ?? ''}
          />
          {errors ? (
            Object.entries(errors).map(([type, error]) => (
              <span
                key={type}
                className="mt-1 flex w-fit items-center gap-1 rounded bg-red-100 p-1 px-2 pt-1 text-red-700"
                id={type}
              >
                <ExclamationCircleIcon className="min-w-[2ch] max-w-[2ch]" />
                {error}
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

NewChannelPage.formMethod = 'PUT' as const;
