import { Form, href, Link, redirect, useNavigation } from "react-router";
import { getUserById, sendConfirmEmail } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import { createMeta } from "~/utils";
import type { Route } from "./+types/welcome.confirm-email";
import { SERVER_ENV } from "~/env.server";

export const meta = createMeta(() => [{ title: "Confirm email" }]);

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  if (request.method !== "PATCH") {
    throw new Response("Not supported", { status: 405 });
  }

  const user = await getUserById(userId, { id: true, requestedEmail: true });

  if (!user) {
    throw new Response("Not found", { status: 404 });
  }

  const mailResult = await sendConfirmEmail(user);

  return { mail: mailResult };
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId, { requestedEmail: true, id: true });

  if (
    !user?.requestedEmail &&
    // while confirming in otl, this will be fired sooner than redirect from
    // nested route, so do not redirect if this is not leaf route
    new URL(request.url).pathname === href("/welcome/confirm-email")
  ) {
    throw redirect("/");
  }

  return { user, allowSkip: !SERVER_ENV.is.prod };
}

export default function ConfirmEmailPage({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const transition = useNavigation();

  return (
    <section className="flex flex-col items-center justify-center p-6">
      <h1 className="my-2 mb-10 text-4xl font-bold">
        Please confirm your email address.
      </h1>
      <p>
        An email with confirmation link has been sent to your email address{" "}
        <a
          href={`mailto:${loaderData.user?.requestedEmail}`}
          className="text-rose-400"
        >
          <b>{loaderData.user?.requestedEmail}</b>
        </a>
        .{" "}
      </p>
      <div className="mt-10 flex w-full gap-2 text-slate-400">
        <Form method="patch">
          {transition.formMethod === "PATCH" ? (
            <span>Sending e-mail...</span>
          ) : (
            <>
              {actionData?.mail?.accepted?.length ? (
                <span>New e-mail has been sent</span>
              ) : (
                <button type="submit">Resend e-mail</button>
              )}
            </>
          )}
        </Form>
        |
        <Form action="/logout" method="post">
          <button type="submit">Log out</button>
        </Form>
        {loaderData.allowSkip && loaderData.user && (
          <>
            |
            <Link className="" to={loaderData.user.id}>
              Skip confirmation
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
