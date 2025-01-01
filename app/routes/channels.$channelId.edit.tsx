import { Form, useNavigation, redirect, data } from "react-router";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";
import {
  CategoryInput,
  getCategoryFormValue,
} from "~/components/CategoryInput";
import { PageHeading } from "~/components/PageHeading";
import { SubmitSection } from "~/components/SubmitSection";
import { WithFormLabel } from "~/components/WithFormLabel";
import type { Channel } from "~/models/channel.server";
import {
  getChannels,
  updateChannel,
  getChannel,
  deleteChannelCategory,
} from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { styles } from "~/styles/shared";
import { createTitle, enumerate, isSubmitting } from "~/utils";
import type { Route } from "./+types/channels.$channelId.edit";

const fieldNames = enumerate([
  "title",
  "description",
  "image-url",
  "category",
  "language",
  "delete-category",
]);

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: createTitle(`Edit ${data?.channel?.title ?? "channel"}`),
    },
  ];
};

type FieldName = keyof typeof fieldNames;

type ActionData = {
  errors: Partial<Record<FieldName, string | null>> | undefined;
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const channelId = params.channelId;
  invariant(channelId, "ChannelId was not provided");
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const form = Object.fromEntries(formData.entries()) as Record<
    FieldName,
    string | null
  >;

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = "Title cannot be undefined";
  }

  if (Object.keys(errors).length !== 0) {
    return data<ActionData>({ errors }, { status: 400 });
  }

  const categoryToDelete = form[fieldNames["delete-category"]];

  const channel = await updateChannel(userId, {
    where: { id: channelId },
    data: {
      title: form.title as string,
      category: categoryToDelete
        ? undefined
        : getCategoryFormValue(formData, fieldNames.category),
      description: form.description ?? "",
      imageUrl: form["image-url"] ?? "",
      language: form.language ?? "",
    },
  });

  if (categoryToDelete) {
    await deleteChannelCategory({
      id: channelId,
      category: categoryToDelete,
      userId,
    });
    return null;
  }

  throw redirect("/channels/".concat(channel.id));
};

type LoaderData = {
  channel: Channel;
  categories: string[];
  focusName: string | null;
};

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs): Promise<LoaderData> => {
  const channelId = params.channelId;
  invariant(channelId, "ChannelId was not provided");
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const focusName = searchParams.get("focus");

  const channel = await getChannel({
    where: { userId, id: params.channelId },
  });
  if (!channel) {
    throw new Response("Not Found", { status: 404 });
  }

  const channels = await getChannels({
    where: { userId },
    select: { category: true },
  });

  const categories =
    channels
      .map((channel) => channel.category.split("/"))
      .flat()
      .filter((category, index, array) => array.indexOf(category) === index) ??
    [];

  if (!channel) {
    throw new Response("Not Found", { status: 404 });
  }

  return { channel, categories, focusName };
};

export default function Channels({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { channel, categories, focusName } = loaderData;
  const transition = useNavigation();

  const isSaving = isSubmitting(transition);

  return (
    <>
      <UseAppTitle>{channel?.title}</UseAppTitle>
      <PageHeading>Edit channel</PageHeading>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        {/* To prevent submitting with category-delete buttons */}
        <input type="submit" hidden />
        <div>
          <WithFormLabel label="Title" required>
            <input
              defaultValue={channel.title}
              name={"title"}
              required
              {...inputProps(focusName === "title")}
            />
          </WithFormLabel>
          {actionData?.errors?.title && (
            <div className="pt-1 text-red-700" id="title-error">
              {actionData.errors.title}
            </div>
          )}
        </div>
        <div>
          <WithFormLabel label="Description">
            <textarea
              defaultValue={channel.description}
              name={"description"}
              {...inputProps(focusName === "description")}
            />
          </WithFormLabel>
        </div>
        <CategoryInput
          categorySuggestions={categories}
          defaultValue={channel.category ?? ""}
          name={"category"}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={inputProps(focusName === "new-category").autoFocus}
        />
        <div>
          <WithFormLabel label="Language">
            <input
              defaultValue={channel.language}
              name={"language"}
              {...inputProps(focusName === "language")}
            />
          </WithFormLabel>
        </div>
        <div>
          <WithFormLabel label="Image URL">
            <input
              defaultValue={channel.imageUrl ?? ""}
              name={"image-url"}
              {...inputProps(focusName === "image-url")}
            />
          </WithFormLabel>
        </div>

        <SubmitSection
          cancelProps={{ to: "/channels/".concat(channel.id) }}
          submitProps={{ children: "Save changes" }}
          isSubmitting={isSaving}
        />
      </Form>
    </>
  );
}

const inputClassName = styles.input;

function inputProps(autoFocus: boolean) {
  return {
    autoFocus,
    className: inputClassName,
  };
}
