import {
  Form,
  href,
  redirect,
  useNavigation,
  useSearchParams,
} from "react-router";
import { SubmitButton } from "~/components/Button";
import { Input } from "~/components/Input";
import { validate } from "~/models/validate";
import { isSubmitting } from "~/utils";
import { Route } from "./+types/welcome.password-reset._index";
import { getUserByEmail, requestPasswordReset } from "~/models/user.server";
import { mapValue } from "~/utils/map-value";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const timeout = new Promise((t) => setTimeout(t, 1000));
  const honeypot = formData.get("password");
  const email = validate.email(formData.get("email"));

  const redirectSearch = mapValue(new URLSearchParams())((s) => {
    if (typeof email === "string") {
      s.set("email", email);
    }
    return s.toString();
  });

  const redirectUrl = href("/welcome/password-reset/email-sent")
    .concat("?")
    .concat(redirectSearch);

  if (honeypot) {
    await timeout;
    return redirect(redirectUrl);
  }

  if (validate.isError(email)) {
    await timeout;
    return { errors: { email: email.message } };
  }

  const [, user] = await Promise.all([
    timeout,
    getUserByEmail(email, { email: true }),
  ]);

  if (!user) {
    return { errors: { email: "No user with this email was found" } };
  }

  const result = await requestPasswordReset(email).catch((e) => {
    console.error(e);
    return null;
  });

  if (result?.operationId) {
    return redirect(redirectUrl);
  } else {
    return { errors: { email: "Something went wrong" } };
  }
}

export default function PasswordReset(props: Route.ComponentProps) {
  const { actionData } = props;
  const transition = useNavigation();
  const [searchParams] = useSearchParams();
  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Forgotten password?
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          No worries, enter your registered email and you will be sent a
          password reset link
        </p>
      </div>
      <div className={`w-full sm:max-w-md `}>
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
                name: "email",
                type: "email",
                error: actionData?.errors?.email,
                required: true,
                defaultValue: searchParams.get("email"),
              },
              {
                label: "Password",
                honeypot: true,
                name: "password",
                type: "password",
              },
            ].map((formField) => (
              <Input
                key={formField.name}
                formLabel={formField.label}
                required={formField.required}
                id={formField.name}
                name={formField.name}
                type={formField.type}
                placeholder={formField.placeholder}
                errors={
                  formField.error ? [{ content: formField.error }] : undefined
                }
                honeypot={formField.honeypot}
                defaultValue={
                  typeof formField.defaultValue === "string"
                    ? formField.defaultValue
                    : undefined
                }
              />
            ))
          }

          <div className="pt-4">
            <SubmitButton
              className="w-full"
              isPending={isSubmitting(transition)}
            >
              Send password reset link
            </SubmitButton>
          </div>
        </Form>
      </div>
    </>
  );
}
