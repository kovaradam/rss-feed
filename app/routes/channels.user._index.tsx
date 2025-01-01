import { requireUser } from "~/session.server";
import { Form, useNavigation } from "react-router";
import {
  BookmarkIcon,
  ClockIcon,
  LogoutIcon,
  MailIcon,
  TrashIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from "@heroicons/react/outline";
import { Button, SubmitButton } from "~/components/Button";
import { AsideWrapper } from "~/components/AsideWrapper";
import { updateUser } from "~/models/user.server";
import { ChannelCategoryLinks } from "~/components/ChannelCategories";
import { getChannels } from "~/models/channel.server";
import { Modal } from "~/components/Modal";
import React from "react";
import { PageHeading } from "~/components/PageHeading";
import { UseAppTitle } from "~/components/AppTitle";
import confirmSound from "/sounds/state-change_confirm-up.wav?url";
import { useSound } from "~/utils/use-sound";
import type { Route } from "./+types/channels.user._index";

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);

  if (request.method === "POST") {
    const updatedUser = updateUser(user.id, {
      soundsAllowed: !user.soundsAllowed,
    });
    return { user: updatedUser };
  }
  throw new Response("Not allowed", { status: 405 });
}

export async function loader(args: Route.LoaderArgs) {
  const user = await requireUser(args.request);
  const channels = await getChannels({ where: { userId: user.id } });
  const categories = channels
    .flatMap((channel) => channel.category.split("/").filter(Boolean))
    .filter((category, idx, array) => array.indexOf(category) === idx)
    .join("/");
  return { user: user, categories };
}

export default function UserPage({ loaderData }: Route.ComponentProps) {
  const { user, categories } = loaderData;
  const transition = useNavigation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [playConfirm] = useSound(confirmSound, { volume: 0.1 });

  return (
    <>
      <UseAppTitle>Your profile</UseAppTitle>
      <div className="relative flex min-h-screen flex-col sm:flex-row">
        <section className="flex flex-1 flex-col gap-8 ">
          <PageHeading>{user.email}</PageHeading>
          <dl>
            {[
              {
                label: "Registered on",
                value: new Date(user.createdAt).toLocaleDateString(),
                icon: <ClockIcon className="h-4" />,
              },
              {
                label: "Categories",
                icon: <BookmarkIcon className="h-4" />,
                value: categories ? (
                  <span className="flex flex-wrap gap-1 ">
                    <ChannelCategoryLinks category={categories} />
                  </span>
                ) : (
                  "No categories yet"
                ),
              },
            ].map((item) => (
              <span
                className="mb-3 flex max-w-[89vw] flex-col items-baseline gap-2 text-gray-400 sm:gap-1 md:mb-1 md:flex-row"
                key={item.label}
              >
                <dt className="flex items-center gap-1">
                  {item.icon} {item.label}:
                </dt>
                <dd className="text-black dark:text-white">{item.value}</dd>
              </span>
            ))}
          </dl>
        </section>
        <AsideWrapper className="sm:w-[22ch]">
          <Form method="post">
            <Button
              type="submit"
              className="flex h-full  gap-2 sm:w-full"
              disabled={transition.formMethod === "PATCH"}
              onClick={() => {
                if (!user.soundsAllowed) {
                  playConfirm();
                }
              }}
            >
              {user.soundsAllowed ? (
                <>
                  <VolumeOffIcon className="h-6 w-4" />{" "}
                  <span className="pointer-events-none hidden sm:block sm:w-full">
                    Disable sounds
                  </span>
                </>
              ) : (
                <>
                  <VolumeUpIcon className="h-6 w-4" />{" "}
                  <span className="pointer-events-none hidden sm:block sm:w-full">
                    Enable sounds
                  </span>
                </>
              )}
            </Button>
          </Form>
          <Form action="edit-email">
            <Button type="submit" className="flex h-full gap-2 sm:w-full">
              <MailIcon className="h-6 w-4" />{" "}
              <span className="pointer-events-none hidden sm:block sm:w-full">
                Update email
              </span>
            </Button>
          </Form>
          <br />
          <Form action="/logout" method="post">
            <Button type="submit" className="flex gap-2 sm:w-full">
              <LogoutIcon className="h-6 w-4" />{" "}
              <span className="hidden sm:block sm:w-full">Log out</span>
            </Button>
          </Form>
          <br className="flex-1" />
          <span className="flex-1 sm:hidden" />

          <Button
            className="script-only flex sm:w-full "
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <TrashIcon className="h-6 w-4" />
            <span className="hidden sm:block sm:w-full">Delete account</span>
          </Button>

          <noscript>
            <Form method="post" action="/logout" className="w-full">
              <Button className="flex sm:w-full " name="action" value="delete">
                <TrashIcon className="h-6 w-4" />
                <span className="hidden sm:block sm:w-full">
                  Delete account
                </span>
              </Button>
            </Form>
          </noscript>

          <Modal
            isOpen={isDeleteDialogOpen}
            onRequestClose={() => setIsDeleteDialogOpen(false)}
            style={{ content: { maxWidth: "90vw", width: "50ch" } }}
          >
            <h2 className="text-2xl">Are you sure?</h2>
            <p className="my-4 text-slate-500">
              This will permanently delete your account
            </p>

            <fieldset className="flex flex-col-reverse place-content-between gap-4 pt-4 md:flex-row">
              <Button
                type="button"
                className=" flex w-full justify-center"
                onClick={() => setIsDeleteDialogOpen(false)}
                data-silent
              >
                <span>Cancel</span>
              </Button>
              <Form method="post" action="/logout" className="w-full">
                <SubmitButton
                  type="submit"
                  className="w-full whitespace-nowrap "
                  data-silent
                  name="action"
                  value="delete"
                >
                  Yes, Delete
                </SubmitButton>
              </Form>
            </fieldset>
          </Modal>
        </AsideWrapper>
      </div>
    </>
  );
}
