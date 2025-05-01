import { href, type MetaFunction } from "react-router";
import { redirect } from "react-router";
import { getUserId, isKnownUser } from "~/session.server";
import { createTitle } from "~/utils";
import type { Route } from "./+types/_index";

export const meta: MetaFunction = () => {
  return [{ title: createTitle("Welcome") }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect(href("/channels"));
  } else if (isKnownUser(request)) {
    throw redirect(href("/welcome/login"));
  } else {
    throw redirect(href("/welcome"));
  }
};
