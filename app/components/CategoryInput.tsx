import { PlusIcon } from '@heroicons/react/outline';
import { Form } from '@remix-run/react';
import React from 'react';
import { Button } from './Button';
import { ChannelCategories } from './ChannelCategories';
import { Tooltip } from './Tooltip';
import { WithFormLabel } from './WithFormLabel';

type Props = {
  fakeInputName: string;
  name: string;
  value: string;
  setValue: (value: React.SetStateAction<string>) => void;
  autoFocus?: boolean;
  inputClassName?: string;
  categorySuggestions: string[];
  formId: string;
};

const showInputId = 'fake-category-input';

function CategoryInput(props: Props): JSX.Element {
  const deleteCategory: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    const categoryToRemove = (event.currentTarget as HTMLButtonElement).value;

    props.setValue((prev) =>
      prev
        .split('/')
        .filter((category) => category !== categoryToRemove)
        .join('/')
    );
  };

  return (
    <WithFormLabel label="Category:" htmlFor={showInputId}>
      <div className="flex gap-1">
        <ChannelCategories category={props.value} delete={deleteCategory} />
      </div>
      <div className="flex gap-2">
        <input
          placeholder="e.g. gardening"
          name={props.fakeInputName}
          autoFocus={props.autoFocus}
          className={props.inputClassName}
          id={showInputId}
          form={props.formId}
          list="category-suggestions"
        />
        <datalist id="category-suggestions">
          {props.categorySuggestions.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </datalist>
        <Button
          className="relative rounded bg-slate-100 px-4 py-2 text-slate-600  hover:bg-slate-200  disabled:bg-slate-300"
          type="submit"
          form={props.formId}
          secondary
          aria-label="Add category"
        >
          <PlusIcon className="w-4 " />
          <Tooltip />
        </Button>
      </div>

      <input value={props.value} type="hidden" name={props.name} />
    </WithFormLabel>
  );
}

CategoryInput.Form = CategoryInputForm;

function CategoryInputForm(
  props: Pick<Props, 'formId' | 'setValue' | 'fakeInputName'>
): JSX.Element {
  return (
    <Form
      id={props.formId}
      onSubmit={(event) => {
        event.preventDefault();
        const category = new FormData(event.target as HTMLFormElement).get(
          props.fakeInputName
        );

        if (typeof category !== 'string') {
          return;
        }

        props.setValue((prev) => {
          if (
            prev.split('/').find((prevCategory) => prevCategory === category)
          ) {
            return prev;
          }
          (event.target as HTMLFormElement)['new-category'].value = '';
          return prev.concat('/').concat(category).concat('/');
        });
      }}
    />
  );
}

export function useCategoryInput({
  defaultValue,
  ...props
}: Omit<Props, 'value' | 'setValue'> & { defaultValue: string }) {
  const [category, setCategory] = React.useState(defaultValue);

  return {
    renderCategoryInput: () => (
      <CategoryInput {...props} value={category} setValue={setCategory} />
    ),
    renderCategoryForm: () => (
      <CategoryInputForm {...props} setValue={setCategory} />
    ),
  };
}
