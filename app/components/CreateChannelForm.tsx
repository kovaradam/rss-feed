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
>(props: { className: string }): JSX.Element {
  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating =
    transition.state !== 'idle' && transition.submission?.method === 'PUT';

  return (
    <Form
      method="put"
      action={window.location.pathname.concat(
        window.location.search.replace('index=', '')
      )}
      className={'flex flex-col gap-8 '.concat(props.className)}
    >
      <fieldset className="flex flex-col gap-2">
        <label htmlFor="new-channel-input">RSS feed address</label>
        <input
          type="url"
          name="channel-url"
          id="new-channel-input"
          autoFocus
          required
          disabled={isCreating}
          placeholder="https://www.example-web.com/rss.xml"
          className={`${styles.input} `}
          aria-invalid="false"
        />
        {errors &&
          Object.entries(errors).map(([type, error]) => (
            <span key={type} className="pt-1 text-red-700" id="title-error">
              {error}
            </span>
          ))}
      </fieldset>
      <SubmitButton type="submit" isLoading={isCreating}>
        {isCreating ? 'Creating...' : 'Add'}
      </SubmitButton>
    </Form>
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
