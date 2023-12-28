import { requireUser } from '~/session.server';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData, useNavigation } from '@remix-run/react';
import {
  BookmarkIcon,
  ClockIcon,
  LogoutIcon,
  MailIcon,
  TrashIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from '@heroicons/react/outline';
import { Button } from '~/components/Button';
import { AsideWrapper } from '~/components/AsideWrapper';
import { updateUser } from '~/models/user.server';
import { ChannelCategoryLinks } from '~/components/ChannelCategories';
import { getChannels } from '~/models/channel.server';
import { Modal } from '~/components/Modal';
import React from 'react';
import { PageHeading } from '~/components/PageHeading';
import { UseAppTitle } from '~/components/AppTitle';
import useSound from 'use-sound';
import confirmSound from 'public/sounds/state-change_confirm-up.wav';

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method === 'PATCH') {
    const updatedUser = updateUser(user.id, {
      soundsAllowed: !user.soundsAllowed,
    });
    return json({ user: updatedUser });
  }
  throw new Response('Not allowed', { status: 405 });
}

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireUser(args.request);
  const channels = await getChannels({ where: { userId: user.id } });
  const categories = channels
    .flatMap((channel) => channel.category.split('/').filter(Boolean))
    .filter((category, idx, array) => array.indexOf(category) === idx)
    .join('/');
  return json({ user: user, categories });
}

export default function UserPage() {
  const { user, categories } = useLoaderData<typeof loader>();
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
                label: 'Registered on',
                value: new Date(user.createdAt).toLocaleDateString(),
                icon: <ClockIcon className="h-4" />,
              },
              {
                label: 'Categories',
                icon: <BookmarkIcon className="h-4" />,
                value: categories ? (
                  <span className="flex flex-wrap gap-1">
                    <ChannelCategoryLinks category={categories} />
                  </span>
                ) : (
                  'No categories yet'
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
                <dd className="text-black">{item.value}</dd>
              </span>
            ))}
          </dl>
        </section>
        <AsideWrapper className="sm:w-[22ch]">
          <Form method="patch">
            <Button
              type="submit"
              secondary
              className="flex h-full  gap-2 sm:w-full"
              disabled={transition.formMethod === 'PATCH'}
              onClick={() => {
                if (!user.soundsAllowed) {
                  playConfirm();
                }
              }}
            >
              {user.soundsAllowed ? (
                <>
                  <VolumeOffIcon className="h-6 w-4" />{' '}
                  <span className="hidden  sm:block sm:w-full">
                    Disable sounds
                  </span>
                </>
              ) : (
                <>
                  <VolumeUpIcon className="h-6 w-4" />{' '}
                  <span className="hidden sm:block sm:w-full">
                    Enable sounds
                  </span>
                </>
              )}
            </Button>
          </Form>
          <Form action="edit-email">
            <Button
              type="submit"
              secondary
              className="flex h-full gap-2 sm:w-full"
            >
              <MailIcon className="h-6 w-4" />{' '}
              <span className="hidden sm:block sm:w-full">Update email</span>
            </Button>
          </Form>
          <br />
          <Form action="/logout" method="post">
            <Button type="submit" secondary className="flex gap-2 sm:w-full">
              <LogoutIcon className="h-6 w-4" />{' '}
              <span className="hidden sm:block sm:w-full">Log out</span>
            </Button>
          </Form>
          <br className="flex-1" />
          <span className="flex-1 sm:hidden" />
          <Button
            className="flex gap-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <TrashIcon className="h-6 w-4" />
            <span className="hidden sm:block sm:w-full">Delete account</span>
          </Button>
          <Modal
            isOpen={isDeleteDialogOpen}
            onRequestClose={() => setIsDeleteDialogOpen(false)}
            style={{ content: { maxWidth: '90vw', width: '50ch' } }}
          >
            <h2 className="text-2xl">Are you sure?</h2>
            <p className="my-4 text-slate-500">
              This will permanently delete your account
            </p>

            <fieldset className="mt-4 flex place-content-between gap-4">
              <Button
                type="button"
                secondary
                className="w-1/2 max-w-[30ch]"
                onClick={() => setIsDeleteDialogOpen(false)}
                data-silent
              >
                Cancel
              </Button>
              <Form method="delete" action="/logout" className="w-1/2">
                <Button
                  type="submit"
                  className="w-full max-w-[30ch] whitespace-nowrap"
                  data-silent
                >
                  Yes, Delete
                </Button>
              </Form>
            </fieldset>
          </Modal>
        </AsideWrapper>
      </div>
    </>
  );
}
