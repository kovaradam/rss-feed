import { PlusIcon } from "@heroicons/react/outline";
import React, { useId } from "react";
import { Button } from "./Button";
import { ChannelCategories } from "./ChannelCategories";
import { Tooltip } from "./Tooltip";
import { WithFormLabel } from "./WithFormLabel";
import { ClientOnly } from "./ClientOnly";
import { styles } from "../styles/shared";

type CategoryInputProps = {
  name: string;
  defaultValue: string;
  autoFocus?: boolean;
  categorySuggestions: string[];
};

export function CategoryInput(props: CategoryInputProps) {
  const [category, setCategory] = React.useState(props.defaultValue);
  const [inputValue, setInputValue] = React.useState("");

  const deleteCategory: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    const categoryToRemove = (event.currentTarget as HTMLButtonElement).value;

    setCategory((prev) =>
      prev
        .split("/")
        .filter((category) => category !== categoryToRemove)
        .join("/")
    );
  };

  const addCategory = () => {
    setCategory((prev) => {
      if (prev.split("/").find((prevCategory) => prevCategory === inputValue)) {
        return prev;
      }
      setInputValue("");
      return prev.concat("/").concat(inputValue).concat("/");
    });
  };

  const inputId = useId();

  return (
    <WithFormLabel label="Category:" htmlFor={inputId}>
      <div className="flex flex-wrap gap-1">
        <ChannelCategories
          category={category}
          onDelete={deleteCategory}
          formName={props.name}
        />
      </div>
      <div className="flex gap-2">
        <input
          placeholder="e.g. gardening"
          name={props.name}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={props.autoFocus}
          className={styles.input}
          id={inputId}
          list="category-suggestions"
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
        />
        <datalist id="category-suggestions">
          {props.categorySuggestions.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </datalist>
        <Button
          className="script-only relative rounded bg-slate-100 px-4 py-2 text-slate-600  hover:bg-slate-200  disabled:bg-slate-300"
          type="button"
          aria-label="Add category"
          onClick={() => {
            addCategory();
            document.getElementById(inputId)?.focus();
          }}
        >
          <PlusIcon className="w-4 " />
          <Tooltip />
        </Button>
      </div>
      <noscript>
        <p className="text-sm text-slate-700">
          To add multiple categories, join them with symbol &quot;/&quot;, e. g.{" "}
          <span className="bg-gray-50">gardening/sports</span>.
        </p>
      </noscript>

      <ClientOnly>
        <input
          value={
            inputValue
              ? `${category}${category.endsWith("/") ? "" : "/"}${inputValue}`
              : category
          }
          type="hidden"
          name={props.name}
        />
      </ClientOnly>
    </WithFormLabel>
  );
}

export function getCategoryFormValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  const uniqueCategories = values
    .flatMap((value) => (typeof value === "string" ? value.split("/") : null))
    .filter(
      (value, index, array) => value !== null && array.indexOf(value) === index
    );

  return uniqueCategories.join("/");
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("concatenates multiple values", () => {
    const formData = new FormData();
    formData.append("c", "a");
    formData.append("c", "b");
    formData.append("c", "c/d");
    expect(getCategoryFormValue(formData, "c")).toBe("a/b/c/d");
  });

  test("ignores duplicates", () => {
    const formData = new FormData();
    formData.append("c", "a");
    formData.append("c", "a");
    expect(getCategoryFormValue(formData, "c")).toBe("a");
  });
}
