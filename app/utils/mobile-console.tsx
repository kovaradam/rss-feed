import { createRoot, Root } from "react-dom/client";

export function logMobile<T>(msg: T) {
  logs.push({ msg, timestamp: Date.now(), id: logs.length });

  renderConsole();
}

let root: Root;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs = [] as Array<{ timestamp: number; msg: any; id: number }>;

function renderConsole() {
  const element = globalThis.document?.getElementById("console");

  if (!element) {
    return;
  }

  root ??= createRoot(element);

  root.render(
    <details>
      <summary>{logs.at(-1)?.msg ?? "Console"}</summary>
      <ul className="flex flex-col-reverse">
        {logs.map((log) => (
          <li key={log.id}>
            {"> "}
            {log.msg}
          </li>
        ))}
      </ul>
    </details>
  );
}
