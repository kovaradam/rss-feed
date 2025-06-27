import { EmailRequest, PasswordReset } from "~/__generated__/prisma/client";
import { SERVER_ENV } from "~/env.server";
import { MailService } from "./mail.server";
import { renderToString } from "react-dom/server";
import { User } from "./user.server";
import { href } from "react-router";

export async function sendConfirmEmail(emailRequest: EmailRequest) {
  const link = `https://${SERVER_ENV.domain}${href(
    "/welcome/confirm-email/:requestId",
    { requestId: emailRequest.id },
  )}`;
  return MailService.send(emailRequest.email, {
    subject: "Please confirm your e-mail address ✔",
    html: renderToString(
      <>
        Thank you for joining us!
        <br />
        <br />
        Please verify your address by visiting <a href={link}>{link}</a>
      </>,
    ),
    text: `Thank you for joining us!\n\nPlease verify your address by visiting ${link}`,
  }).catch(console.error);
}

export async function sendPasswordResetEmail(
  operationId: PasswordReset["id"],
  email: User["email"],
) {
  const link = `https://${SERVER_ENV.domain}${href(
    "/welcome/password-reset/:operationId",
    { operationId },
  )}`;
  return MailService.send(email, {
    subject: "Reset your password ✔",
    html: renderToString(
      <>
        You can now reset your password at <a href={link}>{link}</a>
      </>,
    ),
    text: `You can now reset your password at ${link}`,
  }).catch(console.error);
}
