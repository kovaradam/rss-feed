import { requireUser } from '~/session.server';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import {
  ClockIcon,
  LogoutIcon,
  MailIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/outline';
import { Button } from '~/components/Button';
import { AsideWrapper } from '~/components/AsideWrapper';

export async function loader(args: LoaderArgs) {
  const user = await requireUser(args.request);
  return json({ user: user });
}

export default function UserPage() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="relative flex min-h-screen flex-col sm:flex-row">
        <section className="flex flex-1 flex-col gap-8">
          <dl>
            {[
              {
                label: 'Email',
                value: user.email,
                icon: <MailIcon className="h-4" />,
              },
              {
                label: 'Registered on',
                value: new Date(user.createdAt).toLocaleDateString(),
                icon: <ClockIcon className="h-4" />,
              },
            ].map((item) => (
              <span
                className="mb-1 flex items-center gap-1 text-gray-400"
                key={item.label}
              >
                {item.icon}
                <dt>{item.label}:</dt>
                <dd className="text-black">{item.value}</dd>
              </span>
            ))}
          </dl>
        </section>
        <AsideWrapper>
          <Form action="edit">
            <Button type="submit" secondary className="flex gap-2">
              <PencilIcon className="w-4" /> Update email
            </Button>
          </Form>
          <Form action="/logout" method="post">
            <Button type="submit" secondary className="flex gap-2">
              <LogoutIcon className="w-4" /> Log out
            </Button>
          </Form>
          <Form method="delete" action="/logout">
            <Button type="submit" className="flex gap-2">
              <TrashIcon className="w-4" />
              Delete account
            </Button>
          </Form>
        </AsideWrapper>
      </div>
    </>
  );
}
