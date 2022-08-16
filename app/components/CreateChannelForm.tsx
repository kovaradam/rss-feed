import { PlusIcon, XIcon } from '@heroicons/react/outline';
import { Form, useActionData, useTransition } from '@remix-run/react';
import React from 'react';
import { Button } from './Button';

export function CreateChannelForm<
  ActionData extends Record<string, string>
>(): JSX.Element {
  const [showInput, setShowInput] = React.useState(false);
  const blurTimeout = React.useRef(0);

  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating =
    transition.state === 'submitting' &&
    transition.submission?.method === 'PUT';

  const setBlurTimeout = () => {
    blurTimeout.current = window.setTimeout(() => setShowInput(false));
  };

  const clearBlurTimeout = () => {
    window.clearTimeout(blurTimeout.current);
  };

  return (
    <div
      className="relative m-2 block"
      onBlurCapture={setBlurTimeout}
      onFocusCapture={clearBlurTimeout}
    >
      {showInput ? (
        <Form
          method="put"
          action={window.location.pathname}
          className="flex flex-col gap-1"
        >
          <button
            type="button"
            onClick={() => setShowInput(false)}
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
            className="peer  w-full rounded border border-gray-500 px-2 py-1 leading-loose "
            aria-invalid="false"
          />
          {errors &&
            Object.entries(errors).map(([type, error]) => (
              <span key={type} className="pt-1 text-red-700" id="title-error">
                {error}
              </span>
            ))}
          <Button type="submit" isLoading={isCreating}>
            {isCreating ? 'Creating...' : 'Add'}
          </Button>
        </Form>
      ) : (
        <button
          className="flex w-full items-center gap-2 px-2 py-2 text-left text-xl text-blue-500 hover:bg-blue-50 peer-focus:hidden"
          onClick={() => setShowInput(true)}
        >
          <PlusIcon className="w-4" /> New Channel
        </button>
      )}
    </div>
  );
}
