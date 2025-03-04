import React from "react";
import { styles } from "~/styles/shared";

export function PageSearchInput(props: {
  defaultValue?: string;
  formId: string;
  placeholder?: string;
}) {
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const debounceId = React.useRef(-1);

  return (
    <>
      <input
        form={props.formId}
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
        className={styles.input.concat(" mb-4 py-2 text-center sm:text-left")}
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
