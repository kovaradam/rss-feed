import { validateUserEmail } from "~/models/user.server";
import { logout } from "~/session.server";
import type { Route } from "./+types/welcome.confirm-email.$userId";
import { href, redirect } from "react-router";
import { WithPasskeyFormTabs } from "~/components/WithPasskeyFormTabs";

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = params.userId ?? "";

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser?.loginType) {
    const searchParams = new URLSearchParams();
    searchParams.set(WithPasskeyFormTabs.queryParam, validatedUser.loginType);
    searchParams.set("first", String(true));
    searchParams.set("email", validatedUser.email);

    return logout(
      request,
      href("/welcome/email-confirmed")
        .concat("?")
        .concat(searchParams.toString())
    );
  }

  throw redirect("/");
}

export default function ConfirmEmailPage() {
  return <></>;
}
