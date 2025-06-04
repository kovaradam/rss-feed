import type { ActionFunction } from "react-router";
import { useLoaderData, redirect, data, href } from "react-router";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";

import { CollectionForm } from "~/components/CollectionForm";
import { ErrorMessage } from "~/components/ErrorMessage";
import { getChannels } from "~/models/channel.server";
import type { Collection } from "~/models/collection.server";
import {
  getBooleanValue,
  deleteCollection,
  updateCollection,
  getCollection,
  deleteCollectionCategory,
} from "~/models/collection.server";
import { requireUserId } from "~/session.server";
import { createTitle, enumerate, uniqueArrayFilter } from "~/utils";
import type { Route } from "./+types/channels.collections.$collectionId.edit";
import { getCategoryFormValue } from "~/components/CategoryInput";

const fieldNames = enumerate([
  "title",
  "read",
  "bookmarked",
  "category",
  "language",
  "delete-category",
]);

type FieldName = keyof typeof fieldNames;

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: createTitle(`Edit ${data?.defaultValue?.title ?? "Collection"}`),
    },
  ];
};

type ActionData = {
  errors: Partial<Record<"title", string | null>> | undefined;
};

export const action: ActionFunction = async ({ request, params }) => {
  const collectionId = params.collectionId;
  invariant(collectionId, "Collection id is not defined");
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const form = Object.fromEntries(formData.entries()) as Record<
    FieldName,
    string | null
  >;

  if (formData.get("action") === "delete") {
    await deleteCollection(collectionId, userId);
    throw redirect(href("/channels"));
  }

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = "Title cannot be undefined";
  }

  if (Object.keys(errors).length !== 0) {
    return data<ActionData>({ errors }, { status: 400 });
  }

  const categoryToDelete = form[fieldNames["delete-category"]];

  const collection = await updateCollection(collectionId, userId, {
    title: form.title as string,
    bookmarked: getBooleanValue(form.bookmarked),
    read: getBooleanValue(form.read),
    category: categoryToDelete
      ? undefined
      : (getCategoryFormValue(formData, fieldNames.category) ?? undefined),
    language: form.language ?? undefined,
  });

  if (categoryToDelete) {
    await deleteCollectionCategory({
      id: collectionId,
      category: categoryToDelete,
      userId,
    });
    return null;
  }

  throw redirect(
    href("/channels/collections/:collectionId", { collectionId: collection.id })
  );
};

type LoaderData = {
  categories: string[];
  languages: string[];
  defaultValue: Collection;
};

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs): Promise<LoaderData> => {
  const collectionId = params.collectionId;
  invariant(collectionId, "Collection id is not defined");

  const userId = await requireUserId(request);

  const collection = await getCollection(collectionId, userId);

  if (!collection) {
    throw new Response("Not Found", { status: 404 });
  }
  const channels = await getChannels(userId, {
    select: { category: true, language: true },
  });

  const categories =
    channels
      .map((channel) => channel.category.split("/"))
      .filter(Boolean)
      .flat()
      .filter(uniqueArrayFilter) ?? [];

  const languages =
    channels
      .map((channel) => channel.language)
      .filter(Boolean)
      .filter(uniqueArrayFilter) ?? [];

  return { categories, languages, defaultValue: collection };
};

export default function EditCollectionPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <UseAppTitle>{data.defaultValue.title}</UseAppTitle>
      <CollectionForm<LoaderData, ActionData>
        title={"Edit collection"}
        isEditForm
      />
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
