import type { Route } from "./+types/welcome.login";

import type { MetaFunction } from "react-router";
import {
  data,
  redirect,
  Form,
  Link,
  useSearchParams,
  useNavigation,
} from "react-router";
import * as React from "react";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { isSubmitting, safeRedirect, validateEmail } from "~/utils";
import { SubmitButton } from "~/components/Button";
import { styles } from "~/styles/shared";
import { WithFormLabel } from "~/components/WithFormLabel";

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
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  const remember = formData.get("remember");

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
      { errors: { password: "Password is too short" } },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return data<ActionData>(
      { errors: { email: "Invalid email or password" } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo,
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
        <Form method="post" className="space-y-6">
          {
            // eslint-disable-next-line react-compiler/react-compiler
            [
              {
                label: "Email address",
                placeholder: "name@example.com",
                ref: emailRef,
                id: "email",
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
                id: "password",
                name: "password",
                type: "password",
                ariaInvalid: actionData?.errors?.password ? true : undefined,
                ariaDescribedBy: "password-error",
                error: actionData?.errors?.password,
              },
            ].map((formField) => (
              <WithFormLabel
                key={formField.id}
                htmlFor={formField.id}
                label={formField.label}
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
            ))
          }
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className={"h-4 w-4 "}
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900 dark:text-white"
              >
                Remember me
              </label>
            </div>
          </div>
          <SubmitButton
            className=" w-full self-end"
            isLoading={isSubmitting(transition)}
          >
            Log in
          </SubmitButton>
        </Form>
      </div>
    </>
  );
}
