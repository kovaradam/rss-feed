import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useNavigation,
  data,
  redirect,
} from 'react-router';
import React from 'react';
import { SubmitButton, buttonStyle } from '~/components/Button';
import { WithFormLabel } from '~/components/WithFormLabel';
import {
  createUser,
  getUserByEmail,
  sendConfirmEmail,
} from '~/models/user.server';
import { createUserSession, getUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, safeRedirect, validateEmail } from '~/utils';
import type { Route } from './+types/welcome._index';

export const meta = () => {
  return [{ title: createTitle('Welcome') }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect('/channels');
  }
  return {};
};

interface ActionData {
  errors: {
    email?: string;
    password?: string;
  };
}

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/');

  if (!validateEmail(email)) {
    return data<ActionData>(
      { errors: { email: 'Email is invalid' } },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return data<ActionData>(
      { errors: { password: 'Password is required' } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return data<ActionData>(
      { errors: { password: 'Password is too short' } },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return data<ActionData>(
      { errors: { email: 'User with this email already exists.' } },
      { status: 400 }
    );
  }

  const user = await createUser(email, password);
  sendConfirmEmail(user, request);

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

  const transition = useNavigation();

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  const isSubmitting =
    transition.state === 'submitting' ||
    (transition.state === 'loading' && Boolean(transition.formMethod));

  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Create your journal
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
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
      <div className={`w-full sm:max-w-md`}>
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
            <WithFormLabel
              htmlFor={formField.id}
              label={formField.label}
              key={formField.id}
            >
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
                  className="pt-1 text-red-800 dark:text-red-400"
                  id={formField.ariaDescribedBy}
                >
                  {formField.error}
                </div>
              )}
            </WithFormLabel>
          ))}
          <input
            type="hidden"
            name="redirectTo"
            value={redirectTo}
            disabled={isSubmitting}
          />
          <div className="flex flex-col items-center justify-between gap-1 pt-4 sm:flex-row">
            <SubmitButton
              className="w-full sm:w-48 sm:px-8"
              isLoading={isSubmitting}
            >
              Create Account
            </SubmitButton>
            <span className="text-slate-500">or</span>
            <Link
              to={{
                pathname: 'login',
                search: searchParams.toString(),
              }}
              className={`${buttonStyle} w-full justify-center sm:w-48 `}
            >
              log In
            </Link>{' '}
          </div>
        </Form>
      </div>
    </>
  );
}
