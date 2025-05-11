import { Outlet, redirect } from "react-router";
import { getUserId } from "~/session.server";
import { Route } from "./+types/welcome.password-reset";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  if (userId) {
    return redirect("/");
  }
  return null;
}
export default function PasswordResetLayout() {
  return <Outlet />;
}
