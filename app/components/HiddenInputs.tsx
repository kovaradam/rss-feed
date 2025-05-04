export function HiddenInputs(props: {
  inputs: Array<{ name: string; value: string }>;
}) {
  return (
    <>
      {props.inputs.map((item) => (
        <input
          type="hidden"
          key={item.name}
          name={item.name}
          value={item.value}
        />
      ))}
    </>
  );
}

HiddenInputs.Action = function ActionInput(props: { value: string }) {
  return <input type="hidden" name="action" value={props.value} />;
};
