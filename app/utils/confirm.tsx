import { createRoot, Root } from "react-dom/client";
import { Button, SubmitButton } from "~/components/Button";
import { Modal } from "~/components/Modal";

let root: Root;

export async function $confirm(params: {
  header: React.ReactNode;
  message: React.ReactNode;
  confirm: React.ReactNode;
  reject: React.ReactNode;
}) {
  let confirmOption, rejectOption;
  root ??= createRoot(document.getElementById("confirm-modal") as HTMLElement);

  const result = new Promise((resolve, reject) => {
    confirmOption = () => {
      resolve(null);
      root.render(null);
    };
    rejectOption = () => {
      reject();
      root.render(null);
    };
  });

  root.render(
    <Modal
      isOpen={true}
      onRequestClose={rejectOption}
      style={{ content: { maxWidth: "90vw", width: "50ch" } }}
    >
      <h2 className="text-2xl font-bold">{params.header}</h2>
      <p className="my-4 text-slate-700">{params.message}</p>

      <fieldset className="flex flex-col-reverse place-content-between gap-4 pt-4 md:flex-row">
        <Button
          className=" flex w-full justify-center"
          onClick={rejectOption}
          data-silent
        >
          {params.reject}
        </Button>
        <SubmitButton
          className="w-full whitespace-nowrap "
          data-silent
          onClick={confirmOption}
        >
          {params.confirm}
        </SubmitButton>
      </fieldset>
    </Modal>,
  );
  return result;
}
