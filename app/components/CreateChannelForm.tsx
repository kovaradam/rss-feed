import { Form, useActionData, useTransition } from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';
import { Button, SubmitButton } from './Button';

export function CreateChannelForm<
  ActionData extends Partial<Record<string, string | null>> | undefined
>(props: { className?: string; onReset(): void }): JSX.Element {
  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating =
    transition.state !== 'idle' && transition.submission?.method === 'PUT';

  return (
    <Form
      method="put"
      className={'flex flex-col gap-8 '.concat(props.className ?? '')}
      onReset={props.onReset}
    >
      <fieldset className="flex flex-col gap-2" disabled={isCreating}>
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
        {errors &&
          Object.entries(errors).map(([type, error]) => (
            <span key={type} className="pt-1 text-red-700" id="title-error">
              {error}
            </span>
          ))}
      </fieldset>
      <fieldset
        className="flex flex-col-reverse justify-end gap-2 sm:flex-row"
        disabled={isCreating}
      >
        <Button type="reset" secondary className="min-w-[20ch] flex-none">
          Close
        </Button>
        <SubmitButton
          type="submit"
          className={'min-w-[20ch] flex-1 sm:flex-none'}
        >
          {isCreating ? 'Adding...' : 'Add channel'}
        </SubmitButton>
      </fieldset>
    </Form>
  );
}
