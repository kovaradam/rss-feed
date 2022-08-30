import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import React from 'react';
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
      { errors: { email: 'A user already exists with this email' } },
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
    <main className="relative flex min-h-screen flex-col justify-center bg-white p-4 sm:h-screen sm:flex-row sm:justify-start sm:p-0">
      <section className="hidden flex-col items-center justify-between bg-blue-100 p-[5%] sm:flex sm:h-full sm:w-1/3">
        <div className="flex flex-col gap-4">
          <p className="text-4xl font-bold text-blue-900">
            Keep up with the latest web content using an organized RSS feed.
          </p>
        </div>
        <img src="/reading.svg" alt="Doodle of a person reading"></img>
      </section>
      <section className="flex h-full flex-col gap-8 sm:flex-1 sm:items-center sm:justify-center">
        <div>
          <h2 className="my-2 text-4xl font-bold">Create your journal</h2>
          <p className="text-slate-500">
            Get started with a new account or{' '}
            <Link
              to={{
                pathname: '/login',
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
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  ref={emailRef}
                  id="email"
                  required
                  autoFocus={true}
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={actionData?.errors?.email ? true : undefined}
                  aria-describedby="email-error"
                  className={styles.input}
                />
                {actionData?.errors?.email && (
                  <div className="pt-1 text-red-800" id="email-error">
                    {actionData.errors.email}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={actionData?.errors?.password ? true : undefined}
                  aria-describedby="password-error"
                  className={styles.input}
                />
                {actionData?.errors?.password && (
                  <div className="pt-1 text-red-800" id="password-error">
                    {actionData.errors.password}
                  </div>
                )}
              </div>
            </div>

            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className={`flex items-center justify-center rounded-md  bg-rose-400  px-4 py-3  font-medium text-white hover:bg-rose-500 sm:px-8`}
            >
              Create Account
            </button>
          </Form>
        </div>
      </section>
    </main>
  );
}
