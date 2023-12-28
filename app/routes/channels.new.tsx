import { ExclamationCircleIcon } from '@heroicons/react/outline';
import type { MetaFunction } from '@remix-run/react';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import type { ActionFunctionArgs } from '@remix-run/server-runtime';
import { redirect, json } from '@remix-run/server-runtime';
import React from 'react';
import { UseAppTitle } from '~/components/AppTitle';
import { SubmitButton } from '~/components/Button';
import { PageHeading } from '~/components/PageHeading';
import type { CreateFromXmlErrorType } from '~/models/channel.server';
import { createChannelFromXml } from '~/models/channel.server';
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

export const loader = async () => {
  return json({ title: 'Add new channel' });
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
    newChannel = await createChannelFromXml(channelXml, {
      userId: user.id,
      channelHref: channelUrl.href,
    });
  } catch (error) {
    let response: ActionData;

    switch ((error as Error).message as CreateFromXmlErrorType) {
      case 'cannotAccessDb':
        response = {
          create: 'Cannot save RSS feed at this moment, please try later',
        };
        break;
      case 'channelExists':
        response = {
          create:
            'RSS feed with this address already exists, see the list of your channels',
        };
        break;
      case 'incorrectDefinition':
        response = {
          'xml-parse':
            'Could not parse RSS definition, make sure you provided a correct URL',
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
  const { title } = useLoaderData<typeof loader>();
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
        <fieldset className="flex flex-col gap-2" disabled={isSaving}>
          <label htmlFor="new-channel-input">RSS feed address</label>
          <input
            type="url"
            name="channel-url"
            id="new-channel-input"
            autoFocus
            required
            placeholder="https://www.example-web.com/rss.xml"
            className={`${styles.input} `}
            aria-invalid="false"
          />
          {errors ? (
            Object.entries(errors).map(([type, error]) => (
              <span
                key={type}
                className="flex w-fit items-center gap-1 rounded bg-red-100 p-1 px-2 pt-1 text-red-700"
                id={type}
              >
                <ExclamationCircleIcon className="min-w-[2ch] max-w-[2ch]" />
                {error}
              </span>
            ))
          ) : (
            <span className="pt-1 text-slate-500">
              Provide a URL of a RSS feed you wish to add
            </span>
          )}
        </fieldset>
        <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
          <SubmitButton
            type="submit"
            className={'min-w-[20ch] flex-1 sm:flex-none'}
            disabled={isSaving}
          >
            {isSaving ? 'Adding...' : 'Add channel'}
          </SubmitButton>
        </div>
      </Form>
    </>
  );
}

NewChannelPage.formMethod = 'PUT' as const;
