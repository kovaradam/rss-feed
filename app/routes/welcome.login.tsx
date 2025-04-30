import type { Route } from "./+types/welcome.login";

import * as React from "react";
import {
  type MetaFunction,
  data,
  Form,
  Link,
  redirect,
  useNavigation,
  useSearchParams,
} from "react-router";

import { SubmitButton } from "~/components/Button";
import { WithFormLabel } from "~/components/WithFormLabel";
import { WithPasskeyFormTabs } from "~/components/WithPasskeyFormTabs";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { styles } from "~/styles/shared";
import { isSubmitting, validateEmail } from "~/utils";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);

  if (userId) {
    throw redirect("/");
  }
  return {
    isFirst: Boolean(new URL(request.url).searchParams.get("first")),
  };
};

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
}

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") ?? "/";

  if (!validateEmail(email)) {
    return data<ActionData>(
      { errors: { email: "Email is invalid" } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return data<ActionData>(
      { errors: { password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return data<ActionData>(
      {
        errors: {
          password: "Password is too short, provide at least 8 characters",
        },
      },
      { status: 400 }
    );
  }

  const userId = await verifyLogin(email, password);

  if (!userId) {
    return data<ActionData>(
      { errors: { email: "Invalid email or password" } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: userId,
    redirectTo: redirectTo as string,
  });
};

export const meta: MetaFunction = () => {
  return [
    {
      title: "Login",
    },
  ];
};

export default function LoginPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/channels";
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

  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          {loaderData.isFirst ? "Welcome!" : "Welcome back!"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            className="font-bold underline"
            to={{
              pathname: "/welcome",
              search: searchParams.toString(),
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
      <div className={`w-full sm:max-w-md `}>
        <WithPasskeyFormTabs
          passwordForm={
            <Form
              method="post"
              className="min-h-[var(--welcome-form-min-height)] space-y-6"
            >
              {
                // eslint-disable-next-line react-compiler/react-compiler
                [
                  {
                    label: "Email address",
                    placeholder: "name@example.com",
                    ref: emailRef,
                    name: "email",
                    type: "email",
                    ariaInvalid: actionData?.errors?.email ? true : undefined,
                    ariaDescribedBy: "email-error",
                    error: actionData?.errors?.email,
                  },
                  {
                    label: "Password",
                    placeholder: undefined,
                    ref: passwordRef,
                    name: "password",
                    type: "password",
                    ariaInvalid: actionData?.errors?.password
                      ? true
                      : undefined,
                    ariaDescribedBy: "password-error",
                    error: actionData?.errors?.password,
                  },
                ].map((formField) => (
                  <WithFormLabel
                    key={formField.name}
                    htmlFor={formField.name}
                    label={formField.label}
                  >
                    {({ htmlFor }) => (
                      <>
                        <input
                          ref={formField.ref}
                          id={htmlFor}
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
                      </>
                    )}
                  </WithFormLabel>
                ))
              }

              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="pt-4">
                <SubmitButton
                  className="w-full"
                  isLoading={isSubmitting(transition)}
                >
                  Log in
                </SubmitButton>
              </div>
            </Form>
          }
        />
      </div>
    </>
  );
}
