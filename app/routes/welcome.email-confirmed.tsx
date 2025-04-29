import { href, Link, redirect, useLocation } from "react-router";
import { getUserId } from "~/session.server";
import { createMeta } from "~/utils";
import type { Route } from "./+types/welcome.email-confirmed";

export const meta = createMeta(() => [{ title: "Confirm email" }]);

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/");
  }

  return null;
}

export default function ConfirmEmailPage() {
  const location = useLocation();
  return (
    <section className="flex flex-col items-center justify-center p-6">
      <h1 className="my-2 mb-10 text-4xl font-bold">Email confirmed!</h1>
      <p className="text-slate-500">
        You can continue to{" "}
        <Link
          to={href("/welcome/login")
            .concat("?first=true")
            .concat(location.hash)}
          className="font-bold text-rose-400 underline"
        >
          log in
        </Link>
      </p>
    </section>
  );
}
