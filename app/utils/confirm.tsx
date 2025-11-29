import { createRoot, Root } from "react-dom/client";
import { Button, SubmitButton } from "~/components/Button";
import { Modal } from "~/components/Modal";

let root: Root;

export async function $confirm(params: {
  header: React.ReactNode;
  message: React.ReactNode;
  confirm: React.ReactNode;
  reject: React.ReactNode;
  action?: () => Promise<void>;
}) {
  let confirmOption: () => void, rejectOption;
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
    <Modal isOpen={true} onRequestClose={rejectOption}>
      <h2 className="text-2xl font-bold dark:text-slate-100">
        {params.header}
      </h2>
      <p className="my-4 text-slate-700 dark:text-slate-200">
        {params.message}
      </p>

      <form
        action={async () => {
          await params.action?.();
          confirmOption?.();
        }}
        className="flex flex-col-reverse place-content-between gap-4 pt-4 md:flex-row"
      >
        <Button
          className="flex w-full justify-center"
          onClick={rejectOption}
          data-silent
        >
          {params.reject}
        </Button>
        <SubmitButton className="w-full whitespace-nowrap" data-silent>
          {params.confirm}
        </SubmitButton>
      </form>
    </Modal>,
  );
  return result;
}
