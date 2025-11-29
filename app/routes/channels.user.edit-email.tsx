import { Form, useNavigation, redirect } from "react-router";
import { PageHeader, PageHeading } from "~/components/PageHeading";
import { SubmitSection } from "~/components/SubmitSection";
import { getUserById, requestUpdateUserEmail } from "~/models/user.server";
import { requireUser, requireUserId } from "~/session.server";
import { createMeta } from "~/utils";
import type { Route } from "./+types/channels.user.edit-email";
import { Input } from "~/components/Input";
import { validate } from "~/models/validate";
import { MainSection } from "~/components/MainSection";

export const meta = createMeta();

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const newEmail = validate.email(formData.get("new-email"));

  if (validate.isError(newEmail)) {
    return {
      errors: {
        "new-email": newEmail.message,
      },
    };
  }

  const currentEmail = (await getUserById(userId, { email: true }))?.email;

  if (newEmail === currentEmail) {
    return {
      errors: {
        "new-email": "New and current email cannot be the same",
      },
    };
  }

  const result = await requestUpdateUserEmail(userId, newEmail);

  if (result === "email-taken-error") {
    return {
      errors: {
        "new-email": "Could not use this email",
      },
    };
  }

  throw redirect("/");
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request, { email: true });
  return { user, title: "Edit email" };
}

export default function UserEditPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const transition = useNavigation();
  const isSubmitting = transition.formMethod === "PATCH";

  return (
    <MainSection className="max-w-xl">
      <PageHeader>
        <PageHeading>{loaderData.title}</PageHeading>
      </PageHeader>
      <Form className="flex flex-col gap-4" method="patch">
        {[
          {
            name: "current-email",
            label: "Current email",
            value: loaderData.user.email,
            disabled: true,
          },
          {
            name: "new-email",
            label: <div>New email</div>,
            required: true,
            value: "",
            error: actionData?.errors?.["new-email"],
          },
        ].map((item) => (
          <Input.Email
            key={item.name}
            disabled={item.disabled || isSubmitting}
            defaultValue={item.value}
            id={item.name}
            name={item.name}
            required={item.required}
            formLabel={item.label}
            errors={item.error ? [{ content: item.error }] : undefined}
          />
        ))}
        <SubmitSection
          cancelProps={{ to: "/channels/user" }}
          submitProps={{ children: "Update" }}
          isSubmitting={isSubmitting}
        />
      </Form>
    </MainSection>
  );
}
