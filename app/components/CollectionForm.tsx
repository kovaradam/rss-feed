import type { Collection } from "~/__generated__/prisma/client";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { styles } from "~/styles/shared";
import { Button } from "./Button";
import { CategoryInput } from "./CategoryInput";
import { WithFormLabel } from "./WithFormLabel";
import { PageHeading } from "./PageHeading";
import { SubmitSection } from "./SubmitSection";
import { TrashIcon } from "@heroicons/react/outline";

const inputClassName = styles.input;

type Props = { title: string; isEditForm?: boolean };

export function CollectionForm<
  LoaderData extends {
    categories: string[];
    languages: string[];
    defaultValue?: Collection;
  },
  ActionData extends {
    errors: Partial<Record<"title", string | null>> | undefined;
  },
>(props: Props) {
  const errors = useActionData<ActionData>()?.errors;
  const transition = useNavigation();
  const data = useLoaderData<LoaderData>();

  const isSaving =
    transition.state !== "idle" && transition.formMethod === "POST";

  const isDeleting =
    transition.state !== "idle" &&
    transition.formData?.get("action") === "delete";

  return (
    <div>
      <header className="flex max-w-xl justify-between">
        <PageHeading>{props.title}</PageHeading>
        {props.isEditForm && (
          <Form method="post">
            <Button
              type="submit"
              disabled={isDeleting}
              className="flex h-fit items-center gap-2 md:min-w-[20ch]"
              name="action"
              value="delete"
            >
              <TrashIcon className="w-4" />
              <span className="pointer-events-none hidden md:block">
                {isDeleting ? "Deleting..." : "Delete collection"}
              </span>
            </Button>
          </Form>
        )}
      </header>

      <Form method="post" className="flex max-w-xl flex-col gap-4">
        {/* To prevent submitting with category-delete buttons */}
        <input type="submit" hidden />
        <div>
          <WithFormLabel label={"Title"} required htmlFor="title">
            {(field) => (
              <input
                id={field.htmlFor}
                name={"title"}
                defaultValue={data.defaultValue?.title ?? ""}
                required={field.required}
                className={inputClassName}
              />
            )}
          </WithFormLabel>
          {errors?.title && (
            <div className="pt-1 text-red-700" id="title-error">
              {errors.title}
            </div>
          )}
        </div>

        {(
          [
            {
              label: "Read status",
              name: "read",
              values: [
                { label: "Ignore", value: null },
                { label: "Include only read articles", value: true },
                { label: "Exclude read articles", value: false },
              ],
            },
            {
              label: "Bookmark status",
              name: "bookmarked",
              values: [
                { label: "Ignore", value: null },
                { label: "Include only bookmarked articles", value: true },
                { label: "Exclude bookmarked articles", value: false },
              ],
            },
          ] as const
        ).map(({ label, name, values }) => (
          <div key={name}>
            <WithFormLabel label={label}>
              <div className="flex flex-col gap-2">
                {values.map((radio) => (
                  <label
                    className="flex items-center gap-2 dark:text-white"
                    key={String(radio.value)}
                  >
                    <input
                      defaultChecked={
                        data?.defaultValue === undefined
                          ? radio.value === null
                          : data.defaultValue[name] === radio.value
                      }
                      type="radio"
                      className="accent-rose-600"
                      value={String(radio.value)}
                      name={name}
                    />
                    {radio.label}
                  </label>
                ))}
              </div>
            </WithFormLabel>
          </div>
        ))}

        <CategoryInput
          categorySuggestions={data.categories}
          defaultValue={data.defaultValue?.category ?? ""}
          name={"category"}
        />

        <WithFormLabel label="Language">
          {({ htmlFor }) => (
            <>
              <input
                id={htmlFor}
                name={"language"}
                className={inputClassName}
                list="language-suggestions"
                defaultValue={data.defaultValue?.language ?? ""}
              />
              <datalist id="language-suggestions">
                {data.languages.map((language) => (
                  <option value={language} key={language} />
                ))}
              </datalist>
            </>
          )}
        </WithFormLabel>

        <SubmitSection
          cancelProps={{
            to: data.defaultValue?.id
              ? "/channels/collections/".concat(data.defaultValue?.id ?? "")
              : "/channels",
            scriptOnly: true,
          }}
          submitProps={{
            children: props.isEditForm ? "Save changes" : "Create collection",
          }}
          isSubmitting={isSaving}
        />
      </Form>
    </div>
  );
}
