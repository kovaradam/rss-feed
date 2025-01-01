import { validateUserEmail } from "~/models/user.server";
import { logout } from "~/session.server";
import type { Route } from "./+types/welcome.confirm-email.$userId";

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = params.userId ?? "";

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser) {
    return logout(request, "/welcome/email-confirmed");
  }

  return {};
}

export default function ConfirmEmailPage() {
  return <></>;
}
