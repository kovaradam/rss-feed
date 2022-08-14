import type { Collection } from '@prisma/client';
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';
import { Button } from './Button';
import { useCategoryInput } from './CategoryInput';

const inputClassName = styles.input;

type Props = { deleteFormId?: string; title: string };

export function CollectionForm<
  LoaderData extends {
    categories: string[];
    languages: string[];
    defaultValue?: Collection;
  },
  ActionData extends {
    errors: Partial<Record<'title', string | null>> | undefined;
  }
>(props: Props): JSX.Element {
  const errors = useActionData<ActionData>()?.errors;
  const transition = useTransition();
  const data = useLoaderData<LoaderData>();

  const isSaving =
    transition.state === 'submitting' &&
    transition.submission?.method === 'POST';

  const isDeleting =
    transition.state === 'submitting' &&
    transition.submission?.method === 'DELETE';

  const Categories = useCategoryInput({
    categorySuggestions: data.categories,
    defaultValue: data.defaultValue?.category ?? '',
    fakeInputName: 'new-category',
    formId: 'new-category-form',
    inputClassName: styles.input,
    name: 'category',
  });

  return (
    <>
      <h3 className="mb-2 text-4xl font-bold">{props.title}</h3>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Title: </span>
            <input
              name={'title'}
              defaultValue={data.defaultValue?.title ?? ''}
              placeholder="e.g. Super fun collection"
              required
              className={inputClassName}
            />
          </label>
          {errors?.title && (
            <div className="pt-1 text-red-700" id="title-error">
              {errors.title}
            </div>
          )}
        </div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Read status: </span>
            <fieldset className="flex flex-col gap-2">
              {[
                { label: 'Ignore', value: null },
                { label: 'Include only read articles', value: true },
                { label: 'Include only articles not read yet', value: false },
              ].map((props) => (
                <label
                  className="flex items-center gap-2"
                  key={String(props.value)}
                >
                  <input
                    defaultChecked={
                      data?.defaultValue === undefined
                        ? props.value === null
                        : data.defaultValue.read === props.value
                    }
                    type="radio"
                    className="accent-blue-400"
                    value={String(props.value)}
                    name="read"
                  />
                  {props.label}
                </label>
              ))}
            </fieldset>
          </label>
        </div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Bookmarked status: </span>
            <fieldset className="flex flex-col gap-2">
              {[
                { label: 'Ignore', value: null },
                { label: 'Include only bookmarked articles', value: true },
                { label: 'Exclude bookmarked articles', value: false },
              ].map((props) => (
                <label
                  className="flex items-center gap-2"
                  key={String(props.value)}
                >
                  <input
                    defaultChecked={
                      data?.defaultValue === undefined
                        ? props.value === null
                        : data.defaultValue.bookmarked === props.value
                    }
                    type="radio"
                    className="accent-blue-400"
                    value={String(props.value)}
                    name="bookmarked"
                  />
                  {props.label}
                </label>
              ))}
            </fieldset>
          </label>
        </div>
        <div>{Categories.renderCategoryInput()}</div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Language: </span>
            <input
              name={'language'}
              className={inputClassName}
              list="language-suggestions"
              defaultValue={data.defaultValue?.language ?? ''}
            />
            <datalist id="language-suggestions">
              {data.languages.map((language) => (
                <option value={language} key={language} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {props.deleteFormId && (
            <Button
              form={props.deleteFormId}
              type="submit"
              disabled={isDeleting}
              secondary
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Form>
      {Categories.renderCategoryForm()}
      {props.deleteFormId && (
        <Form method="delete" id={props.deleteFormId}></Form>
      )}
    </>
  );
}
