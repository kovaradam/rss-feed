import { href, Link, useSearchParams } from "react-router";
import { Route } from "./+types/welcome.password-reset.email-sent";
import { SERVER_ENV } from "~/env.server";
import { getUserByEmail } from "~/models/user.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (SERVER_ENV.is.passwordResetSkip && typeof email === "string") {
    const user = await getUserByEmail(email, { passwordReset: true });

    if (user?.passwordReset?.id) {
      return {
        skipLink: href("/welcome/password-reset/:operationId", {
          operationId: user.passwordReset.id,
        }),
      };
    }
  }

  return null;
}

export default function PasswordResetEmailSent(props: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Email has been sent
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          There should be an email with the password reset link in your inbox.
          If it is not, check your spam folder or{" "}
          <Link
            className="font-bold underline"
            to={{
              pathname: href("/welcome/password-reset"),
              search: searchParams.toString(),
            }}
          >
            try again
          </Link>
        </p>
      </div>
      {props.loaderData?.skipLink && (
        <Link to={props.loaderData.skipLink}>confirm</Link>
      )}
    </>
  );
}
