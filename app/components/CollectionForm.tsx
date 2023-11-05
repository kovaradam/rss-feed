import type { Collection } from '@prisma/client';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import React from 'react';
import { styles } from '~/styles/shared';
import { AsideWrapper } from './AsideWrapper';
import { Button, SubmitButton } from './Button';
import { useCategoryInput } from './CategoryInput';
import { WithFormLabel } from './WithFormLabel';

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
  const transition = useNavigation();
  const data = useLoaderData<LoaderData>();

  const isSaving =
    transition.state !== 'idle' && transition.formMethod === 'POST';

  const isDeleting =
    transition.state !== 'idle' && transition.formMethod === 'DELETE';

  const Categories = useCategoryInput({
    categorySuggestions: data.categories,
    defaultValue: data.defaultValue?.category ?? '',
    fakeInputName: 'new-category',
    formId: 'new-category-form',
    inputClassName: styles.input,
    name: 'category',
  });

  const isEditForm = Boolean(props.deleteFormId);

  return (
    <div className={`${transition.state === 'loading' ? 'opacity-60' : ''}`}>
      <h3 className="mb-2 text-4xl font-bold">{props.title}</h3>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        <div>
          <WithFormLabel label={'Title'} required htmlFor="title">
            {(field) => (
              <input
                id={field.htmlFor}
                autoFocus
                name={'title'}
                defaultValue={data.defaultValue?.title ?? ''}
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
              label: 'Read status',
              name: 'read',
              values: [
                { label: 'Ignore', value: null },
                { label: 'Include only read articles', value: true },
                { label: 'Include only articles not read yet', value: false },
              ],
            },
            {
              label: 'Bookmark status',
              name: 'bookmarked',
              values: [
                { label: 'Ignore', value: null },
                { label: 'Include only bookmarked articles', value: true },
                { label: 'Exclude bookmarked articles', value: false },
              ],
            },
          ] as const
        ).map(({ label, name, values }) => (
          <div key={name}>
            <WithFormLabel label={label}>
              <div className="flex flex-col gap-2">
                {values.map((radio) => (
                  <label
                    className="flex items-center gap-2"
                    key={String(radio.value)}
                  >
                    <input
                      defaultChecked={
                        data?.defaultValue === undefined
                          ? radio.value === null
                          : data.defaultValue[name] === radio.value
                      }
                      type="radio"
                      className="accent-rose-400"
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

        <AsideWrapper className="flex-row-reverse justify-end sm:flex-row sm:items-end sm:justify-end md:flex-row">
          {props.deleteFormId && (
            <Button
              form={props.deleteFormId}
              type="submit"
              disabled={isDeleting}
              className="sm:min-w-[20ch] "
              secondary
            >
              {isDeleting ? 'Deleting...' : 'Delete collection'}
            </Button>
          )}
          <SubmitButton
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:min-w-[20ch] sm:flex-none"
          >
            {isSaving ? (
              <>{isEditForm ? 'Saving...' : 'Creating...'}</>
            ) : (
              <>{isEditForm ? 'Save changes' : 'Create collection'}</>
            )}
          </SubmitButton>
        </AsideWrapper>
      </Form>
      {Categories.renderCategoryForm()}
      {props.deleteFormId && (
        <Form method="delete" id={props.deleteFormId}></Form>
      )}
    </div>
  );
}
