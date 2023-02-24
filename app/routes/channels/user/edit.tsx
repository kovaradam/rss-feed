import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { SubmitButton } from '~/components/Button';
import {
  getUserByEmail,
  getUserById,
  updateUserEmail,
} from '~/models/user.server';
import { requireUser, requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createMeta } from '~/utils';

export const meta = createMeta();

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const newEmail = formData.get('new-email');

  if (!newEmail) {
    return json({
      errors: {
        'new-email': 'This field is required',
      },
    });
  }

  if (typeof newEmail !== 'string') {
    return json({
      errors: {
        'new-email': 'New email is in invalid format',
      },
    });
  }

  const currentEmail = (await getUserById(userId))?.email;

  if (newEmail === currentEmail) {
    return json({
      errors: {
        'new-email': 'New and old email cannot be the same',
      },
    });
  }

  const userByEmail = await getUserByEmail(newEmail);

  if (userByEmail) {
    return json({
      errors: {
        'new-email': 'User with this email already exists',
      },
    });
  }

  await updateUserEmail(userId, newEmail);

  return redirect('/');
}

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  return json({ user, title: 'Edit email' });
}

export default function UserEditPage() {
  const data = useLoaderData<typeof loader>();
  const actionResponse = useActionData<typeof action>();
  const transition = useTransition();
  const isSubmitting = transition.submission?.method === 'PATCH';

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
            error: actionResponse?.errors?.['new-email'],
          },
        ].map((item) => (
          <fieldset
            key={item.name}
            className="flex w-full flex-col gap-1"
            disabled={item.disabled || isSubmitting}
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
            {item.error && <p className="pt-1 text-red-700">{item.error}</p>}
          </fieldset>
        ))}
        <SubmitButton className="self-end" isLoading={isSubmitting}>
          Update
        </SubmitButton>
      </Form>
    </>
  );
}
