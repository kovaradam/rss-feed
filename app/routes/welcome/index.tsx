import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import React from 'react';
import { SubmitButton } from '~/components/Button';
import { createUser, getUserByEmail } from '~/models/user.server';
import { createUserSession, getUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, safeRedirect, validateEmail } from '~/utils';

export const meta: MetaFunction = () => {
  return { title: createTitle('Welcome') };
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/channels');
  }
  return json({});
};

interface ActionData {
  errors: {
    email?: string;
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/');

  if (!validateEmail(email)) {
    return json<ActionData>(
      { errors: { email: 'Email is invalid' } },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json<ActionData>(
      { errors: { password: 'Password is required' } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json<ActionData>(
      { errors: { password: 'Password is too short' } },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json<ActionData>(
      { errors: { email: 'User with this email already exists.' } },
      { status: 400 }
    );
  }

  const user = await createUser(email, password);

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo,
  });
};

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/channels';
  const actionData = useActionData() as ActionData;
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <>
      <div>
        <h2 className="my-2 text-4xl font-bold">Create your journal</h2>
        <p className="text-slate-500">
          Get started with a new account or{' '}
          <Link
            to={{
              pathname: 'login',
              search: searchParams.toString(),
            }}
            className={`font-bold underline`}
          >
            log In
          </Link>{' '}
          if you already have one.
        </p>
      </div>
      <div className="w-full max-w-md">
        <Form method="post" className="space-y-6">
          {[
            {
              label: 'Email address',
              placeholder: 'name@example.com',
              ref: emailRef,
              id: 'email',
              name: 'email',
              type: 'email',
              ariaInvalid: actionData?.errors?.email ? true : undefined,
              ariaDescribedBy: 'email-error',
              error: actionData?.errors?.email,
            },
            {
              label: 'Password',
              placeholder: undefined,
              ref: passwordRef,
              id: 'password',
              name: 'password',
              type: 'password',
              ariaInvalid: actionData?.errors?.password ? true : undefined,
              ariaDescribedBy: 'password-error',
              error: actionData?.errors?.password,
            },
          ].map((formField) => (
            <div key={formField.id}>
              <label
                htmlFor={formField.id}
                className="block text-sm font-medium text-gray-700"
              >
                {formField.label}
              </label>
              <div className="mt-1">
                <input
                  ref={formField.ref}
                  id={formField.id}
                  required
                  name={formField.name}
                  type={formField.type}
                  placeholder={formField.placeholder}
                  aria-invalid={formField.ariaInvalid}
                  aria-describedby={formField.ariaDescribedBy}
                  className={styles.input}
                />
                {formField.error && (
                  <div
                    className="pt-1 text-red-800"
                    id={formField.ariaDescribedBy}
                  >
                    {formField.error}
                  </div>
                )}
              </div>
            </div>
          ))}

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <SubmitButton className="w-full sm:w-48 sm:px-8">
            Create Account
          </SubmitButton>
        </Form>
      </div>
    </>
  );
}
