import {
  Form,
  useNavigation,
  redirect,
  data,
  href,
  useFetcher,
} from "react-router";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";
import {
  CategoryInput,
  getCategoryFormValue,
} from "~/components/CategoryInput";
import { PageHeader, PageHeading } from "~/components/PageHeading";
import { SubmitSection } from "~/components/SubmitSection";
import { WithFormLabel } from "~/components/WithFormLabel";
import {
  getChannels,
  updateChannel,
  getChannel,
  deleteChannelCategory,
  deleteChannel,
} from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { styles } from "~/styles/shared";
import { createTitle, enumerate, isSubmitting } from "~/utils";
import type { Route } from "./+types/channels.$channelId.edit";
import { Channel } from "~/models/types.server";
import { Button } from "~/components/Button";
import { $confirm } from "~/utils/confirm";
import { HiddenInputs } from "~/components/HiddenInputs";
import { TrashIcon } from "@heroicons/react/outline";
import { MainSection } from "~/components/MainSection";

const fieldNames = enumerate([
  "title",
  "description",
  "image-url",
  "category",
  "language",
  "delete-category",
  "action",
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

  if (form.action === "delete") {
    await deleteChannel({ userId, id: params.channelId });
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

  throw redirect(href("/channels/:channelId", { channelId: channel.id }));
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

  const channels = await getChannels(userId, {
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
  const fetcher = useFetcher();

  return (
    <MainSection className="max-w-xl">
      <UseAppTitle>Edit channel</UseAppTitle>
      <PageHeader className="flex justify-between gap-2">
        <PageHeading>{channel?.title}</PageHeading>
        <Form
          method="post"
          onSubmit={async (event) => {
            event.preventDefault();
            await $confirm({
              header: "Are you sure?",
              message: "This will delete all saved data from this channel",
              confirm: "Yes, delete",
              reject: "No, cancel",
              action: async () => {
                const formEl = event.target as typeof event.currentTarget;
                await fetcher.submit(formEl, {
                  method: formEl.method as never,
                });
              },
            });
          }}
        >
          <HiddenInputs inputs={{ loader: "true", action: "delete" }} />
          <Button
            type="submit"
            className="flex w-fit items-center gap-2 sm:w-full"
            isPending={fetcher.formData?.get("action") === "delete"}
            aria-label="Delete channel"
          >
            <TrashIcon className="size-4" />
            <span className="text-nowrap max-sm:hidden">Delete channel</span>
          </Button>
        </Form>
      </PageHeader>
      <Form method="post" className="flex flex-col gap-4">
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
            {({ htmlFor }) => (
              <input
                id={htmlFor}
                defaultValue={channel.language}
                name={"language"}
                {...inputProps(focusName === "language")}
              />
            )}
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
          cancelProps={{
            to: href("/channels/:channelId", { channelId: channel.id }),
          }}
          submitProps={{ children: "Save changes" }}
          isSubmitting={isSaving}
        />
      </Form>
    </MainSection>
  );
}

const inputClassName = styles.input;

function inputProps(autoFocus: boolean) {
  return {
    autoFocus,
    className: inputClassName,
  };
}
