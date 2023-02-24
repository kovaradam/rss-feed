import { Response } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import type { User } from '~/models/user.server';
import { deleteUserById, getUsers, makeUserAdmin } from '~/models/user.server';
import { requireUser } from '~/session.server';

function requireAdmin(user: User) {
  if (!user.isAdmin) {
    throw new Response('Not found', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  requireAdmin(user);

  if (request.method === 'DELETE') {
    const formData = await request.formData();
    const userId = String(formData.get('user-id'));

    const deletedUser = await deleteUserById(userId);

    return json({ user: deletedUser, action: 'deleted' });
  }

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const userId = String(formData.get('user-id'));
    const isAdmin = formData.get('is-admin') === 'true';

    const updatedUser = await makeUserAdmin(userId, !isAdmin);
    console.log(updatedUser);

    return json({ user: updatedUser, action: 'updated' });
  }

  throw new Response('Unsupported', { status: 405 });
}

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  requireAdmin(user);

  const users = await getUsers();

  return json({ users });
}

export default function AdminIndexPage() {
  const data = useLoaderData<typeof loader>();
  const actionResponse = useActionData<typeof action>();
  const transition = useTransition();

  return (
    <>
      <section className="p-5">
        <h2>Users</h2>
        <table className="table-auto ">
          <thead>
            <tr>
              <td className="pr-5">Email</td>
              <td className="pr-5">Requested email</td>
              <td className="pr-5">Created at</td>
              <td className="pr-5">Updated at</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.requestedEmail}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{new Date(user.updatedAt).toLocaleDateString()}</td>
                <td className="flex gap-1">
                  <Form method="delete">
                    <input type="hidden" value={user.id} name="user-id" />
                    <button
                      type="submit"
                      className="whitespace-nowrap text-red-800"
                    >
                      Delete user
                    </button>
                  </Form>
                  <Form method="patch">
                    <input type="hidden" value={user.id} name="user-id" />
                    <input
                      type="hidden"
                      value={String(user.isAdmin)}
                      name="is-admin"
                    />
                    <button type="submit" className="whitespace-nowrap">
                      {user.isAdmin ? 'Make not admin' : 'Make admin'}
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transition.submission?.method === 'DELETE' && <div>Deleting user</div>}
        {transition.submission?.method === 'PATCH' && <div>Updating user</div>}

        {actionResponse?.user && (
          <p className="text-green-600">
            {actionResponse.action === 'deleted' ? 'Deleted' : 'Updated'} user{' '}
            <b>{actionResponse.user.email}</b>
          </p>
        )}
      </section>
    </>
  );
}
