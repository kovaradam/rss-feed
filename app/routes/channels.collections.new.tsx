import { redirect, data } from 'react-router';
import { UseAppTitle } from '~/components/AppTitle';
import { CollectionForm } from '~/components/CollectionForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { getChannels } from '~/models/channel.server';
import { createCollection, getBooleanValue } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { createTitle, uniqueArrayFilter } from '~/utils';
import type { Route } from './+types/channels.collections.new';

const _fieldNames = [
  'title',
  'read',
  'bookmarked',
  'category',
  'language',
] as const;

export const meta = () => {
  return [
    {
      title: createTitle(`New collection`),
    },
  ];
};

type FieldName = (typeof _fieldNames)[number];

type ActionData = {
  errors: Partial<Record<FieldName, string | null>> | undefined;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const form = Object.fromEntries(formData.entries()) as Record<
    FieldName,
    string | null
  >;

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = 'Title cannot be undefined';
  }

  if (Object.keys(errors).length !== 0) {
    return data<ActionData>({ errors }, { status: 400 });
  }

  const collection = await createCollection({
    data: {
      userId,
      title: form.title as string,
      bookmarked: getBooleanValue(form.bookmarked),
      read: getBooleanValue(form.read),
      category: form.category ?? undefined,
      language: form.language ?? undefined,
    },
  });

  throw redirect('/channels/collections/'.concat(collection.id));
};

type LoaderData = {
  categories: string[];
  languages: string[];
};

export const loader = async ({
  request,
}: Route.LoaderArgs): Promise<LoaderData> => {
  const userId = await requireUserId(request);

  const channels = await getChannels({
    where: { userId },
    select: { category: true, language: true },
  });

  const categories =
    channels
      .map((channel) => channel.category.split('/'))
      .filter(Boolean)
      .flat()
      .filter(uniqueArrayFilter) ?? [];

  const languages =
    channels
      .map((channel) => channel.language)
      .filter(Boolean)
      .filter(uniqueArrayFilter) ?? [];

  return { categories, languages };
};

export default function NewCollectionPage() {
  return (
    <>
      <UseAppTitle>New collection</UseAppTitle>
      <CollectionForm title="Create a new collection" />
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
