import clsx from "clsx";
import React from "react";
import { styles } from "~/styles/shared";

export function PageSearchInput(props: {
  defaultValue?: string;
  formId: string;
  placeholder?: string;
}) {
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceId = React.useRef(-1);

  React.useEffect(() => {
    const controller = new AbortController();

    globalThis.addEventListener(
      "keydown",
      (event) => {
        if (inputRef.current === document.activeElement) {
          // allow default browser action
          return;
        }
        if (event.key === "k" && (event.ctrlKey || event.metaKey)) {
          inputRef.current?.focus();
          event.preventDefault();
        }
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <input
        form={props.formId}
        ref={inputRef}
        name={PageSearchInput.names.search}
        type="search"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        onChange={() => {
          window.clearTimeout(debounceId.current);
          debounceId.current = window.setTimeout(
            () => submitButtonRef.current?.click(),
            500,
          );
        }}
        className={clsx(styles.input, "mb-4 py-2 text-center sm:text-left")}
      />
      <button
        type="submit"
        form={props.formId}
        className="hidden"
        ref={submitButtonRef}
      />
    </>
  );
}

PageSearchInput.names = { search: "q" };
