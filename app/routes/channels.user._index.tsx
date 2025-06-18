import { getBrowserSessionId, requireUser } from "~/session.server";
import { Form, href, useFetcher, useNavigation } from "react-router";
import {
  BookmarkIcon,
  CheckCircleIcon,
  ClockIcon,
  FingerPrintIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  LogoutIcon,
  MailIcon,
  TrashIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from "@heroicons/react/outline";
import { Button, SubmitButton } from "~/components/Button";
import {
  removePasskeyOfUser,
  updatePassword,
  updateUser,
  verifyLogin,
} from "~/models/user.server";
import { ChannelCategoryLinks } from "~/components/ChannelCategories";

import React from "react";
import { PageHeading } from "~/components/PageHeading";
import { UseAppTitle } from "~/components/AppTitle";
import enableSound from "/sounds/state-change_confirm-up.wav?url";
import disableSound from "/sounds/state-change_confirm-down.wav?url";
import { useSound } from "~/utils/use-sound";
import type { Route } from "./+types/channels.user._index";
import { Details } from "~/components/Details";
import { useIsPasskeySupported } from "~/utils/use-is-passkey-supported";
import { PasskeyAddForm } from "~/components/PasskeyAddForm";
import { HiddenInputs } from "~/components/HiddenInputs";
import { enumerate } from "~/utils";
import { confirm } from "~/utils/confirm";
import { InputError } from "~/components/InputError";
import { Input } from "~/components/Input";
import { validate } from "~/models/validate";
import { List } from "~/components/List";

const actions = enumerate([
  "toggle-sound",
  "remove-passkey",
  "update-password",
]);

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request, {
    soundsAllowed: true,
    id: true,
    email: true,
    password: { select: { id: true } },
    passkeys: { select: { id: true } },
  });

  const formData = await request.formData();
  switch (formData.get("action")) {
    case actions["toggle-sound"]: {
      const updatedUser = updateUser(
        user.id,
        {
          soundsAllowed: !user.soundsAllowed,
        },
        { soundsAllowed: true }
      );
      return { user: updatedUser };
    }
    case actions["remove-passkey"]: {
      const passkeyId = formData.get("passkey-id") || null;
      const isOnlyLoginOption = user.passkeys.length === 1 && !user.password;
      if (typeof passkeyId !== "string" || isOnlyLoginOption) {
        return { errors: { passkey: "Could not delete passkey", passkeyId } };
      }
      const updatedUser = removePasskeyOfUser({
        userId: user.id,
        passkeyId: passkeyId,
        select: { passkeys: { select: { id: true } } },
      });
      return { user: updatedUser };
    }

    case actions["update-password"]: {
      const currentPassword = validate.password(
          formData.get("current-password")
        ),
        newPassword = validate.password(formData.get("new-password"));

      if (user.password) {
        if (validate.isError(currentPassword)) {
          return {
            errors: { currentPassword: currentPassword.message },
          };
        }

        const verifiedUser = await verifyLogin(user.email, currentPassword);

        if (!verifiedUser) {
          return {
            errors: {
              currentPassword: "Provided password is incorrect",
            },
          };
        }
      }

      if (validate.isError(newPassword)) {
        return { errors: { newPassword: newPassword.message } };
      }

      await updatePassword({
        userId: user.id,
        newPassword: newPassword,
      });

      return user.password
        ? { passwordUpdated: true, updatedAt: Date.now() }
        : { passwordCreated: true, updatedAt: Date.now() };
    }
  }
  throw new Response("Not allowed", { status: 405 });
}

export async function loader(args: Route.LoaderArgs) {
  const sessionId = await getBrowserSessionId(args.request);
  const user = await requireUser(args.request, {
    channels: { select: { category: true } },
    email: true,
    createdAt: true,
    soundsAllowed: true,
    passkeys: {
      select: {
        lastUsedAt: true,
        id: true,
        sessions: { select: { id: true } },
      },
    },
    password: { select: { id: true, sessions: { select: { id: true } } } },
  });

  const categories = user?.channels
    .flatMap((channel) => channel.category.split("/").filter(Boolean))
    .filter((category, idx, array) => array.indexOf(category) === idx)
    .join("/");

  return {
    user: {
      ...user,
      password: user.password
        ? {
            isCurrentLogin: user.password?.sessions.find(
              (s) => s.id === sessionId
            ),
            sessionCount: user.password.sessions.length,
          }
        : undefined,

      passkeys: user.passkeys.map((p) => ({
        isCurrentLogin: Boolean(p.sessions.find((s) => s.id === sessionId)),
        lastUsedAt: p.lastUsedAt,
        id: p.id,
        sessionCount: p.sessions.length,
      })),
    },
    categories,
  };
}

export default function UserPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user, categories } = loaderData;
  const navigation = useNavigation();
  const [playEnable] = useSound(enableSound, { volume: 0.1 });
  const [playDisable] = useSound(disableSound, { volume: 0.1 });
  const isPasskeySupported = useIsPasskeySupported();

  const fetcher = useFetcher();
  actionData ??= fetcher.data;
  return (
    <>
      <UseAppTitle>Your profile</UseAppTitle>
      <div className="relative flex min-h-screen flex-col sm:flex-row">
        <section className="flex flex-1 flex-col gap-8 ">
          <div className="flex justify-between">
            <PageHeading>{user.email}</PageHeading>
            <Form action={href("/logout")} method="post">
              <Button className="flex ">
                <LogoutIcon className="h-6 w-4" />
                <span className="w-full">Log out</span>
              </Button>
            </Form>
          </div>
          <dl>
            {[
              {
                label: "Registered on",
                value: (
                  <time>
                    {new Date(user.createdAt).toLocaleDateString("en", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                ),
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
          <hr></hr>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold dark:text-white">General</h4>

            <Form method="post" className="w-full sm:w-min">
              <HiddenInputs inputs={{ action: actions["toggle-sound"] }} />
              <Button
                type="submit"
                className="flex w-full min-w-[20ch] gap-2"
                disabled={navigation.formMethod === "PATCH"}
                data-silent
                onClick={() => {
                  if (!user.soundsAllowed) {
                    playEnable();
                  } else {
                    playDisable();
                  }
                }}
              >
                {user.soundsAllowed ? (
                  <>
                    <VolumeOffIcon className="h-6 w-4" />{" "}
                    <span className="pointer-events-none w-full">
                      Disable sounds
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeUpIcon className="h-6 w-4" />{" "}
                    <span className="pointer-events-none w-full">
                      Enable sounds
                    </span>
                  </>
                )}
              </Button>
            </Form>

            <h4 className="font-bold dark:text-white">Login and credentials</h4>
            <Form
              action={href("/channels/user/edit-email")}
              className="w-full sm:w-min"
            >
              <Button type="submit" className="flex w-full min-w-[20ch] gap-2">
                <MailIcon className="h-6 w-4" />{" "}
                <span className="pointer-events-none w-full">Update email</span>
              </Button>
            </Form>
            {(actionData?.passwordCreated || actionData?.passwordUpdated) && (
              <div className="flex gap-1 rounded bg-green-100 p-2 pl-4 text-green-800">
                <CheckCircleIcon className="inline w-4 min-w-4" />
                <p className="flex-1 text-center">
                  Password was{" "}
                  {actionData.passwordCreated ? <>created</> : <>updated</>}{" "}
                  successfuly
                </p>
              </div>
            )}
            <Details
              title={user.password ? "Update password" : "Add password"}
              icon={<LockClosedIcon className="w-4" />}
              key={actionData?.updatedAt}
            >
              <Form method="post" className="flex flex-col gap-2">
                <HiddenInputs.Action value={actions["update-password"]} />

                {loaderData.user.password?.isCurrentLogin && (
                  <p className="text-slate-600">
                    <InformationCircleIcon className="inline w-4 min-w-4" />{" "}
                    This will log you out of this device
                    {loaderData.user.password?.sessionCount > 1 && (
                      <> and other devices logged in using this password</>
                    )}
                  </p>
                )}

                {loaderData.user.password && (
                  <Input.Password
                    name="current-password"
                    formLabel="Current password"
                    autoComplete="current-password"
                    required
                    errors={
                      actionData?.errors?.currentPassword
                        ? [{ content: actionData?.errors?.currentPassword }]
                        : undefined
                    }
                  />
                )}

                <Input.Password
                  name="new-password"
                  formLabel="New password"
                  autoComplete="new-password"
                  required
                  errors={
                    actionData?.errors?.newPassword
                      ? [{ content: actionData?.errors?.newPassword }]
                      : undefined
                  }
                />
                <SubmitButton>
                  {loaderData.user.password ? (
                    <>Update password</>
                  ) : (
                    <>Add password</>
                  )}
                </SubmitButton>
              </Form>
            </Details>
            <Details
              title={"Manage passkeys"}
              icon={<FingerPrintIcon className="w-4" />}
            >
              {user.passkeys.length === 0 && !isPasskeySupported && (
                <p className="text-center text-slate-700">
                  You have no passkeys
                </p>
              )}
              <List className="">
                {user.passkeys.map((passkey) => (
                  <React.Fragment key={passkey.id}>
                    <li className="mb-1 flex overflow-hidden rounded-sm border last:mb-2 dark:border-slate-700">
                      <KeyIcon className="w-8 min-w-8 border-r bg-slate-100 p-2 text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 " />
                      <dl className="flex  flex-1 flex-col sm:flex-row">
                        {[
                          {
                            label: "Last login:",
                            value: (
                              <time>
                                {passkey.lastUsedAt?.toLocaleDateString("en", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "2-digit",
                                }) ?? "-"}
                              </time>
                            ),
                          },
                          {
                            label: "Status:",
                            value: (
                              <div className=" overflow-hidden rounded-md">
                                {passkey.sessionCount > 0 ? (
                                  <span className=" bg-green-100 p-1 text-green-700 dark:bg-green-700 dark:text-green-200">
                                    {passkey.sessionCount} Device
                                    {passkey.sessionCount === 1 ? "" : "s"}{" "}
                                    logged in
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 p-1 text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                                    No device logged in
                                  </span>
                                )}
                              </div>
                            ),
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="min-w-24 border-b p-2 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 dark:border-slate-700"
                          >
                            <dd className="text-sm text-slate-600 dark:text-slate-400">
                              {item.label}
                            </dd>
                            <dt>{item.value}</dt>
                          </div>
                        ))}
                      </dl>
                      {(user.passkeys.length > 1 || user.password) && (
                        <form
                          className="justify-end"
                          method="post"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await confirm({
                              header: "Are you sure?",
                              message: (
                                <>
                                  {passkey.isCurrentLogin ? (
                                    <>This will log you out on this device</>
                                  ) : passkey.sessionCount > 0 ? (
                                    <>
                                      This will log you out on device
                                      {passkey.sessionCount === 1
                                        ? ""
                                        : "s"}{" "}
                                      using this key
                                    </>
                                  ) : (
                                    <>You will permanently delete this key</>
                                  )}
                                </>
                              ),
                              confirm: "Yes, delete",
                              reject: "No, cancel",
                            });
                            fetcher.submit(e.target as typeof e.currentTarget);
                          }}
                        >
                          <HiddenInputs
                            inputs={{
                              action: actions["remove-passkey"],
                              ["passkey-id"]: passkey.id,
                            }}
                          />
                          <button
                            aria-label="Delete passkey"
                            className="h-full border-l p-2 dark:border-slate-700"
                          >
                            <TrashIcon className="pointer-events-none w-4 min-w-4" />
                          </button>
                        </form>
                      )}
                    </li>
                    {actionData?.errors?.passkeyId === passkey.id && (
                      <InputError className="mb-2">
                        {actionData?.errors.passkey}
                      </InputError>
                    )}
                  </React.Fragment>
                ))}
              </List>
              {isPasskeySupported && <PasskeyAddForm />}
            </Details>
            <h4 className="font-bold dark:text-white">Account</h4>
            <fetcher.Form
              method="post"
              action={href("/logout")}
              className="w-full sm:w-fit"
              onSubmit={async (e) => {
                e.preventDefault();
                await confirm({
                  header: <>Are you sure?</>,
                  message: <>This will permanently delete your account</>,
                  confirm: "Yes, delete",
                  reject: "No, cancel",
                });
                fetcher.submit(e.target as typeof e.currentTarget);
              }}
            >
              <HiddenInputs inputs={{ action: "delete" }} />
              <Button className="flex w-full min-w-[20ch] bg-slate-700 text-white hover:bg-slate-800">
                <TrashIcon className="h-6 w-4" />
                <span className="w-full">Delete account</span>
              </Button>
            </fetcher.Form>
          </div>
        </section>
      </div>
    </>
  );
}
