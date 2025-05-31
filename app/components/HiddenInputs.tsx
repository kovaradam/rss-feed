export function HiddenInputs(props: { inputs: Record<string, string> }) {
  return (
    <>
      {Object.entries(props.inputs).map(([name, value]) => (
        <input type="hidden" key={name} name={name} value={value} />
      ))}
    </>
  );
}

HiddenInputs.Action = function ActionInput(props: { value: string }) {
  return <HiddenInputs inputs={{ action: props.value }} />;
};
