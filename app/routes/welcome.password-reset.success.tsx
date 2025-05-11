import { href, Link } from "react-router";

export default function PasswordResetSuccess() {
  return (
    <>
      <div>
        <h1 className="my-2 text-4xl font-bold dark:text-white">
          Your password has been updated!
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          You can now{" "}
          <Link
            className="font-bold underline"
            to={{
              pathname: href("/welcome/login"),
            }}
          >
            log in
          </Link>{" "}
          with your new password.
        </p>
      </div>
    </>
  );
}
