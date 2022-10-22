import { PlusIcon, XIcon } from '@heroicons/react/outline';
import {
  Form,
  useActionData,
  useSearchParams,
  useTransition,
} from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';
import { browserApiSwitch } from '~/utils';
import { SubmitButton } from './Button';

export function CreateChannelForm<
  ActionData extends Partial<Record<string, string | null>> | undefined
>(): JSX.Element {
  const [isOpen, setIsInputOpen] = useCreateChannelHandle();
  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating =
    transition.state !== 'idle' && transition.submission?.method === 'PUT';

  return (
    <div className="relative m-2 block">
      {isOpen ? (
        <Form
          method="put"
          action={window.location.pathname.concat(window.location.search)}
          className="flex flex-col gap-2"
        >
          <button
            type="button"
            onClick={() => setIsInputOpen(false)}
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
            className={`peer leading-loose ${styles.input} text-base sm:bg-white`}
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
          className="flex w-full items-center gap-2 px-2 py-2 text-left text-xl text-yellow-900 hover:bg-slate-100 peer-focus:hidden"
          onClick={() => setIsInputOpen(true)}
        >
          <PlusIcon className="w-4" /> Add RSS Channel
        </button>
      )}
    </div>
  );
}

const OPEN_CHANNEL_FORM_KEY = 'new-channel';

export function useCreateChannelHandle() {
  const [searchParams, navigateParams] = useSearchParams();

  const isOpen = browserApiSwitch(
    searchParams.get(OPEN_CHANNEL_FORM_KEY),
    null
  );

  const setIsOpen = (newIsOpen: boolean) => {
    if (newIsOpen) {
      searchParams.set(OPEN_CHANNEL_FORM_KEY, String(true));
    } else {
      searchParams.delete(OPEN_CHANNEL_FORM_KEY);
    }
    navigateParams(searchParams, { replace: true });
  };

  return [isOpen, setIsOpen] as const;
}
