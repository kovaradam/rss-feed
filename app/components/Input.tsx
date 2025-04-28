import { styles } from "~/styles/shared";
import { WithFormLabel } from "./WithFormLabel";
import { ExclamationIcon } from "@heroicons/react/outline";
import { useFormStatus } from "react-dom";

interface Props extends React.ComponentProps<"input"> {
  formLabel?: React.ReactNode;
  errors?: { content: React.ReactNode; id: string }[];
}

export function Input({ formLabel, errors, ...inputProps }: Props) {
  const formStatus = useFormStatus();
  const input = (
    <>
      <input
        {...inputProps}
        className={styles.input.concat(" ").concat(inputProps.className ?? "")}
        disabled={inputProps.disabled || formStatus.pending}
        aria-describedby={(inputProps["aria-describedby"] ?? "").concat(
          errors?.map((e) => e.id).join(" ") ?? ""
        )}
      ></input>
      {errors?.map((e) => (
        <div
          className="flex items-start gap-1 pt-1 text-red-800 dark:text-red-400"
          key={e?.toString()}
          id={e.id}
        >
          <ExclamationIcon className="h-6 w-4 min-w-4" />
          {e.content}
        </div>
      ))}
    </>
  );

  if (formLabel) {
    return <WithFormLabel label={formLabel}>{input}</WithFormLabel>;
  }

  return input;
}
