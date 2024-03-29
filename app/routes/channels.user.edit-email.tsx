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
import { PageHeading } from '~/components/PageHeading';
import { SubmitSection } from '~/components/SubmitSection';
import {
  getUserByEmail,
  getUserById,
  requestUpdateUserEmail,
} from '~/models/user.server';
import { requireUser, requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createMeta } from '~/utils';

export const meta = createMeta();

export async function action({ request }: ActionFunctionArgs) {
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
        'new-email': 'New and current email cannot be the same',
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

  await requestUpdateUserEmail(userId, newEmail, request);

  return redirect('/');
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return json({ user, title: 'Edit email' });
}

export default function UserEditPage() {
  const data = useLoaderData<typeof loader>();
  const actionResponse = useActionData<typeof action>();
  const transition = useNavigation();
  const isSubmitting = transition.formMethod === 'PATCH';

  return (
    <>
      <PageHeading>{data.title}</PageHeading>
      <Form className="flex max-w-xl flex-col gap-4" method="patch">
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
                New email <span className="text-slate-500">(required)</span>
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
        <SubmitSection
          cancelProps={{ to: '/channels/user' }}
          submitProps={{ children: 'Update' }}
          isSubmitting={isSubmitting}
        />
      </Form>
    </>
  );
}
