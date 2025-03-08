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
import { useAppForm } from "~/forms";
import { formOptions, mergeForm, useTransform } from "@tanstack/react-form";
import * as v from "valibot";
import {
  createServerValidate,
  initialFormState,
  ServerValidateError,
} from "@tanstack/react-form/remix";
export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);

  if (userId) {
    throw redirect("/");
  }
  return {
    isFirst: Boolean(new URL(request.url).searchParams.get("first")),
  };
};

const formDef = formOptions({
  defaultValues: { email: "", password: "" },
  validators: {
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: v.object({
      email: v.pipe(
        v.string(),
        v.email("Email address should contain '@' followed by a valid domain")
      ),
      password: v.pipe(
        v.string(),
        v.minLength(8, "Password must be at least 8 characters long")
      ),
    }),
  },
});

const serverValidate = createServerValidate({
  ...formDef,
  onServerValidate: () => {
    return { email: "rong" };
  },
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  const remember = formData.get("remember");

  try {
    await serverValidate(formData);
    const user = await verifyLogin(email as string, password as string);

    if (!user) {
      return { email: "Invalid email or password" };
    }

    return createUserSession({
      request,
      userId: user.id,
      remember: remember === "on" ? true : false,
      redirectTo,
    });
  } catch (e) {
    if (e instanceof ServerValidateError) {
      console.log(e.formState.errors);
      return e.formState;
    }

    throw e;
  }
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
  const navigation = useNavigation();
  console.log(actionData);

  const form = useAppForm({
    ...formDef,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, actionData ?? initialFormState),
      [actionData]
    ),
  });

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
          <form.AppField name={"email"}>
            {(field) => (
              <field.TextField
                label={"Email address"}
                type="email"
                placeholder="name@example.com"
                ref={emailRef}
              />
            )}
          </form.AppField>
          <form.AppField name={"password"}>
            {(field) => (
              <field.TextField
                label={"Password"}
                type="password"
                ref={passwordRef}
              />
            )}
          </form.AppField>

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
            isLoading={isSubmitting(navigation)}
          >
            Log in
          </SubmitButton>
        </Form>
      </div>
    </>
  );
}
