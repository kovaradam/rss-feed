import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';

import { createUserSession, getUserId } from '~/session.server';
import { verifyLogin } from '~/models/user.server';
import { safeRedirect, validateEmail } from '~/utils';
import { SubmitButton } from '~/components/Button';
import { styles } from '~/styles/shared';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/');
  }
  return json({});
};

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/');

  const remember = formData.get('remember');

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

  const user = await verifyLogin(email, password);

  if (!user) {
    return json<ActionData>(
      { errors: { email: 'Invalid email or password' } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === 'on' ? true : false,
    redirectTo,
  });
};

export const meta: MetaFunction = () => {
  return {
    title: 'Login',
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/channels';
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
        <h2 className="my-2 text-4xl font-bold">Welcome back!</h2>
        <p className="text-slate-500">
          Don't have an account?{' '}
          <Link
            className="font-bold underline"
            to={{
              pathname: '/',
              search: searchParams.toString(),
            }}
          >
            Sign up
          </Link>
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
          <SubmitButton className="w-full sm:w-48 sm:px-8">Log in</SubmitButton>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className={
                  'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                }
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <div className="text-center text-sm text-gray-500"></div>
          </div>
        </Form>
      </div>
    </>
  );
}
