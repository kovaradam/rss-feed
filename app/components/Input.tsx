import { styles } from "~/styles/shared";
import { WithFormLabel } from "./WithFormLabel";

interface Props extends React.ComponentProps<"input"> {
  formLabel?: React.ReactNode;
}

export function Input(props: Props) {
  const input = (
    <input
      {...props}
      className={styles.input.concat(" ").concat(props.className ?? "")}
    ></input>
  );

  if (props.formLabel) {
    return <WithFormLabel label={props.formLabel}>{input}</WithFormLabel>;
  }

  return input;
}
