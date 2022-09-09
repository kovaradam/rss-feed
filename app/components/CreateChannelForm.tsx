import { PlusIcon, XIcon } from '@heroicons/react/outline';
import {
  Form,
  useActionData,
  useSearchParams,
  useTransition,
} from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';
import { OPEN_PARAM_KEY } from '~/utils';
import { SubmitButton } from './Button';

export function CreateChannelForm<
  ActionData extends Partial<Record<string, string | null>> | undefined
>(): JSX.Element {
  const [params, navigateParams] = useSearchParams();

  const showInput = params.get(OPEN_PARAM_KEY);

  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating =
    transition.state !== 'idle' && transition.submission?.method === 'PUT';

  return (
    <div className="relative m-2 block">
      {showInput ? (
        <Form
          method="put"
          action={window.location.pathname}
          className="flex flex-col gap-2"
        >
          <button
            type="button"
            onClick={() => navigateParams([])}
            className="absolute top-0 right-0 w-4"
          >
            <XIcon className="w-4" />
          </button>
          <label htmlFor="new-channel-input">RSS feed address</label>
          <input
            type="url"
            name="channel-url"
            id="new-channel-input"
            autoFocus
            required
            disabled={isCreating}
            placeholder="https://www.example-web.com/rss.xml"
            className={`peer leading-loose ${styles.input} text-base`}
            aria-invalid="false"
          />
          {errors &&
            Object.entries(errors).map(([type, error]) => (
              <span key={type} className="pt-1 text-red-700" id="title-error">
                {error}
              </span>
            ))}
          <SubmitButton type="submit" isLoading={isCreating}>
            {isCreating ? 'Creating...' : 'Add'}
          </SubmitButton>
        </Form>
      ) : (
        <button
          className="flex w-full items-center gap-2 px-2 py-2 text-left text-xl text-blue-500 hover:bg-blue-50 peer-focus:hidden"
          onClick={() =>
            navigateParams(new URLSearchParams([[OPEN_PARAM_KEY, 'true']]), {
              replace: true,
            })
          }
        >
          <PlusIcon className="w-4" /> New Channel
        </button>
      )}
    </div>
  );
}
