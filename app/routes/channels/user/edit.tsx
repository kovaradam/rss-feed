import { Form, useLoaderData } from '@remix-run/react';
import type { LoaderArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { SubmitButton } from '~/components/Button';
import { requireUser } from '~/session.server';
import { styles } from '~/styles/shared';
import { createMeta } from '~/utils';

export const meta = createMeta();

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  return json({ user, title: 'Edit email' });
}

export default function UserEditPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <h3 className="mb-2 text-4xl font-bold">{data.title}</h3>
      <Form className="flex flex-col gap-4" method="patch">
        {[
          {
            name: 'current-email',
            label: 'Current email',
            value: data.user.email,
            disabled: true,
          },
          {
            name: 'new-email',
            label: (
              <div>
                New email <span className="text-slate-400">(required)</span>
              </div>
            ),
            required: true,
            value: '',
          },
        ].map((item) => (
          <fieldset
            key={item.name}
            className="flex w-full flex-col gap-1"
            disabled={item.disabled}
          >
            <label htmlFor={item.name}>{item.label}</label>
            <input
              className={styles.input}
              defaultValue={item.value}
              id={item.name}
              name={item.name}
              required={item.required}
              type="email"
            />
          </fieldset>
        ))}
        <SubmitButton className="self-end">Update</SubmitButton>
      </Form>
    </>
  );
}
