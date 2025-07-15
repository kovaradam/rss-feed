import { Form, href, Link, redirect, useNavigation } from "react-router";
import { SubmitButton } from "~/components/Button";
import { Route } from "./+types/welcome.password-reset.$operationId";
import { Input } from "~/components/Input";
import { enumerate, isSubmitting, stallHoneypot } from "~/utils";
import { getPasswordReset, resetPassword } from "~/models/user.server";
import { validate } from "~/models/validate";
import { HiddenInputs } from "~/components/HiddenInputs";

export async function loader({ params }: Route.LoaderArgs) {
  const operation = await getPasswordReset(params.operationId).catch(
    () => null,
  );

  return { operationId: operation?.id };
}

const fieldNames = enumerate(["password", "confirm-password", "operation-id"]);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const stall = stallHoneypot();
  const honeypot = formData.get(fieldNames["confirm-password"]);

  if (honeypot) {
    await stall;
    return {
      errors: { [fieldNames["confirm-password"]]: "Passwords don't match" },
    };
  }

  const password = validate.password(formData.get(fieldNames["password"]));

  if (validate.isError(password)) {
    await stall;
    return { errors: { [fieldNames.password]: password.message } };
  }

  const operationId = formData.get(fieldNames["operation-id"]);

  const result = await resetPassword({
    operationId: String(operationId),
    newPassword: password,
  });

  if (result !== "success") {
    await stall;
    return { errors: { [fieldNames.password]: "Could not update password" } };
  }

  return redirect(href("/welcome/password-reset/success"));
}

export default function PasswordResetForm(props: Route.ComponentProps) {
  const { actionData, loaderData } = props;
  const transition = useNavigation();
  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Reset password
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {loaderData?.operationId ? (
            <>You can now enter your new password</>
          ) : (
            <>
              Your request to reset password has expired, please{" "}
              <Link
                className="font-bold underline"
                to={href("/welcome/password-reset")}
              >
                try again
              </Link>
            </>
          )}
        </p>
      </div>
      {loaderData.operationId && (
        <div className={`w-full sm:max-w-md `}>
          <Form method="post" className="min-h-(--welcome-form-min-height) ">
            <HiddenInputs
              inputs={{
                [fieldNames["operation-id"]]: loaderData.operationId,
              }}
            />
            {
              // eslint-disable-next-line react-compiler/react-compiler
              [
                {
                  label: "Password",
                  name: fieldNames["password"],
                  error: actionData?.errors.password,
                },
                {
                  label: "Confirm password",
                  honeypot: true,
                  name: fieldNames["confirm-password"],
                },
              ].map((formField) => (
                <Input.Password
                  key={formField.name}
                  formLabel={formField.label}
                  required={!formField.honeypot}
                  id={formField.name}
                  name={formField.name}
                  errors={
                    formField.error ? [{ content: formField.error }] : undefined
                  }
                  honeypot={formField.honeypot}
                />
              ))
            }

            <div className="pt-10">
              <SubmitButton
                className="w-full"
                isPending={isSubmitting(transition)}
              >
                Update password
              </SubmitButton>
            </div>
          </Form>
        </div>
      )}
    </>
  );
}
