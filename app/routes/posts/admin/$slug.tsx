import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import { deletePost, getPost, updatePost } from "~/models/post.server";
import type { Post } from "~/models/post.server";

type LoaderData = { post: Post };

type ActionData =
  | {
      title: string | null;
      markdown: string | null;
    }
  | undefined;

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json<LoaderData>({ post });
};

export const action: ActionFunction = async ({ request, params }) => {
  await new Promise((res) => setTimeout(res, 1000));
  const formData = await request.formData();
  const slug = params.slug;

  invariant(slug, "slug is undefined");

  if (request.method === "DELETE") {
    await deletePost(slug);
    return redirect(`/posts/admin`);
  }

  const title = formData.get("title");
  const markdown = formData.get("markdown");

  invariant(typeof title === "string", "title has to be of type string");
  invariant(typeof markdown === "string", "markdown has to be of type string");

  const errors: ActionData = {
    title: title ? null : "Title is undefined",
    markdown: markdown ? null : "Markdown is undefined",
  };

  const hasErrors = Object.values(errors).some((error) => error !== null);

  if (hasErrors) {
    return json<ActionData>(errors);
  }

  await updatePost({ title, markdown, slug });

  return redirect(`/posts/admin`);
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function EditPost() {
  const { post } = useLoaderData<LoaderData>();
  const errors = useActionData<ActionData>();
  const transition = useTransition();

  const isCreating = transition.submission?.method === "POST";
  const isDeleting = transition.submission?.method === "DELETE";

  return (
    <>
      <Form method="post">
        <p>
          <label>
            Post Title:{" "}
            {errors?.title ? (
              <em className="text-red-600">{errors.title}</em>
            ) : null}
            <input
              type="text"
              name="title"
              defaultValue={post.title}
              className={inputClassName}
            />
          </label>
        </p>
        <p>
          <label htmlFor="markdown">
            Markdown:{" "}
            {errors?.markdown ? (
              <em className="text-red-600">{errors.markdown}</em>
            ) : null}
          </label>
          <br />
          <textarea
            id="markdown"
            rows={20}
            name="markdown"
            className={`${inputClassName} font-mono`}
            defaultValue={post.markdown}
          ></textarea>
        </p>
        <p className="flex justify-between">
          <button
            type="submit"
            className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
            disabled={isCreating}
          >
            {isCreating ? "submitting" : "Update Post"}
          </button>
        </p>
      </Form>
      <Form method="delete">
        <button
          type="submit"
          name="delete"
          className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
          disabled={isDeleting}
        >
          {isDeleting ? "deleting" : "Delete Post"}
        </button>
      </Form>
    </>
  );
}
