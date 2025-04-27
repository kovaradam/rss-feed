import { styles } from "~/styles/shared";
import { WithFormLabel } from "./WithFormLabel";

interface Props extends React.ComponentProps<"input"> {
  formLabel?: React.ReactNode;
}

export function Input({ formLabel, ...inputProps }: Props) {
  const input = (
    <input
      {...inputProps}
      className={styles.input.concat(" ").concat(inputProps.className ?? "")}
    ></input>
  );

  if (formLabel) {
    return <WithFormLabel label={formLabel}>{input}</WithFormLabel>;
  }

  return input;
}
