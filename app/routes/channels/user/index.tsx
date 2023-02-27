import { requireUser } from '~/session.server';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Response } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData, useTransition } from '@remix-run/react';
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

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);

  if (request.method === 'PATCH') {
    const updatedUser = updateUser(user.id, {
      soundsAllowed: !user.soundsAllowed,
    });
    return json({ user: updatedUser });
  }
  throw new Response('Not allowed', { status: 405 });
}

export async function loader(args: LoaderArgs) {
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
  const transition = useTransition();

  return (
    <>
      <div className="relative flex min-h-screen flex-col sm:flex-row">
        <section className="flex flex-1 flex-col gap-8 ">
          <h3 className="text-3xl font-bold sm:text-4xl ">{user.email}</h3>
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
                className="mb-3 flex max-w-[89vw] flex-col items-center gap-2 text-gray-400 sm:items-baseline sm:gap-1 md:mb-1 md:flex-row"
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
        <AsideWrapper>
          <Form method="patch">
            <Button
              type="submit"
              secondary
              className="flex gap-2"
              disabled={transition.submission?.method === 'PATCH'}
            >
              {user.soundsAllowed ? (
                <>
                  <VolumeOffIcon className="w-4" />{' '}
                  <span className="hidden sm:block">Disable sounds</span>
                </>
              ) : (
                <>
                  <VolumeUpIcon className="w-4" />{' '}
                  <span className="hidden sm:block">Enable sounds</span>
                </>
              )}
            </Button>
          </Form>
          <Form action="edit-email">
            <Button type="submit" secondary className="flex gap-2">
              <MailIcon className="w-4" />{' '}
              <span className="hidden sm:block">Update email</span>
            </Button>
          </Form>
          <br />
          <Form action="/logout" method="post">
            <Button type="submit" secondary className="flex gap-2">
              <LogoutIcon className="w-4" />{' '}
              <span className="hidden sm:block">Log out</span>
            </Button>
          </Form>
          <br className="flex-1" />
          <span className="flex-1 sm:hidden" />
          <Form method="delete" action="/logout">
            <Button type="submit" className="flex gap-2">
              <TrashIcon className="w-4" />
              <span className="hidden sm:block">Delete account</span>
            </Button>
          </Form>
        </AsideWrapper>
      </div>
    </>
  );
}
