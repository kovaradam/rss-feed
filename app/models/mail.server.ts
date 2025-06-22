import nodemailer from "nodemailer";
import type { MailOptions } from "nodemailer/lib/json-transport";
import { SERVER_ENV } from "~/env.server";

export class MailService {
  private static config: Awaited<ReturnType<typeof this.createTransporter>>;

  static async send(
    recipient: string,
    options: Omit<MailOptions, "from" | "to">
  ) {
    // send mail with defined transport object

    MailService.config ??= await this.createTransporter(SERVER_ENV.is.prod);

    const { transporter, account } = MailService.config;

    const info = await transporter.sendMail({
      ...options,
      from: `"Web Journal 📖" <${account.user}>`, // sender address
      to: recipient,
    });

    console.log("Message sent: ", info.messageId, " rcpt: ", info.accepted);

    if (MailService.config.isPreview) {
      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
  }

  static createTransporter = async (isProduction: boolean) => {
    let account;
    if (isProduction) {
      account = {
        user: SERVER_ENV.mail.user,
        pass: SERVER_ENV.mail.password,
      };
    } else {
      // Generate test SMTP service account from ethereal.email
      account = await nodemailer.createTestAccount();
    }

    const transporter = nodemailer.createTransport({
      host: isProduction ? SERVER_ENV.mail.smtpUrl : "smtp.ethereal.email",
      port: isProduction ? 465 : 587,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
    return { transporter, account, isPreview: !isProduction };
  };
}
