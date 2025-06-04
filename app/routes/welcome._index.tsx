import React from "react";
import {
  data,
  Form,
  href,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { buttonStyle, SubmitButton } from "~/components/Button";
import { WithPasskeyFormTabs } from "~/components/WithPasskeyFormTabs";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { createTitle } from "~/utils";
import type { Route } from "./+types/welcome._index";
import { Input } from "~/components/Input";
import { validate } from "~/models/validate";

export const meta = () => {
  return [{ title: createTitle("Welcome") }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect(href("/channels"));
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
  const email = validate.email(formData.get("email"));
  const password = validate.password(formData.get("password"));
  const redirectTo = formData.get("redirectTo") ?? "/";

  if (validate.isError(email) || validate.isError(password)) {
    return data<ActionData>(
      {
        errors: {
          email: validate.getError(email),
          password: validate.getError(password),
        },
      },
      { status: 400 }
    );
  }

  let user: Awaited<ReturnType<typeof createUser>>;
  try {
    const existingUser = await getUserByEmail(email, { id: true });
    if (existingUser) {
      return data<ActionData>(
        { errors: { email: "User with this email already exists." } },
        { status: 400 }
      );
    }

    user = await createUser({
      email,
      auth: { password, type: "password" },
    });
  } catch (e) {
    console.error(e);
    return data<ActionData>(
      { errors: { email: "Something went wrong, please try again later" } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    redirectTo: redirectTo as string,
    credential: { type: "password", passwordId: user.passwordId as string },
  });
};

export default function Welcome() {
  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") ?? "/channels";
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
    transition.state === "submitting" ||
    (transition.state === "loading" && Boolean(transition.formMethod));

  const toLogin = {
    pathname: href("/welcome/login"),
    search: searchParams.toString(),
  };

  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Create your journal
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Get started with a new account or{" "}
          <Link to={toLogin} className={`font-bold underline`}>
            log In
          </Link>{" "}
          if you already have one.
        </p>
      </div>
      <div className={`w-full sm:max-w-md`}>
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
                    ariaInvalid: actionData?.errors?.password
                      ? true
                      : undefined,
                    ariaDescribedBy: "password-error",
                    error: actionData?.errors?.password,
                  },
                ].map((formField) => (
                  <Input
                    key={formField.id}
                    formLabel={formField.label}
                    ref={formField.ref}
                    id={formField.id}
                    required
                    name={formField.name}
                    type={formField.type}
                    placeholder={formField.placeholder}
                    errors={
                      formField.error
                        ? [{ content: formField.error }]
                        : undefined
                    }
                  />
                ))
              }
              <input
                type="hidden"
                name="redirectTo"
                value={redirectTo}
                disabled={isSubmitting}
              />
              <div className="flex flex-col items-center justify-between gap-1 pt-4 sm:flex-row">
                <SubmitButton
                  className="w-full sm:w-48 sm:px-8"
                  isPending={isSubmitting}
                >
                  Create Account
                </SubmitButton>
                <span className="text-slate-500">or</span>
                <Link
                  to={toLogin}
                  className={`${buttonStyle} w-full justify-center sm:w-48 `}
                >
                  log In
                </Link>{" "}
              </div>
            </Form>
          }
        />
      </div>
    </>
  );
}
