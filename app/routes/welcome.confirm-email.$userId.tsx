import { validateUserEmail } from "~/models/user.server";
import { logout } from "~/session.server";
import type { Route } from "./+types/welcome.confirm-email.$userId";
import { href, redirect } from "react-router";

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = params.userId ?? "";

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser?.loginType) {
    return logout(
      request,
      href("/welcome/email-confirmed").concat(`#${validatedUser.loginType}`)
    );
  }

  throw redirect("/");
}

export default function ConfirmEmailPage() {
  return <></>;
}
