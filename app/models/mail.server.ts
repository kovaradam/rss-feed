import nodemailer from 'nodemailer';
import type { MailOptions } from 'nodemailer/lib/json-transport';

export class Mail {
  private static config: Awaited<ReturnType<typeof createTransporter>>;

  static async send(recipient: string, options: MailOptions) {
    // send mail with defined transport object

    Mail.config ??= await createTransporter();

    const { transporter, account } = Mail.config;

    const info = await transporter.sendMail({
      ...options,
      from: `"Web Journal 📖" <${account.user}>`, // sender address
      to: recipient, // list of receivers
    });

    console.log('Message sent: ', info.messageId, ' rcpt: ', info.accepted);

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    return info;
  }
}

export async function createTransporter() {
  const isProduction = process.env.NODE_ENV === 'production';

  let account;
  if (isProduction) {
    account = {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    };
  } else {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    account = await nodemailer.createTestAccount();
  }

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: isProduction ? process.env.SMTP_URL : 'smtp.ethereal.email',
    port: isProduction ? 465 : 587,
    auth: {
      user: account.user, // generated ethereal user
      pass: account.pass, // generated ethereal password
    },
  });
  return { transporter, account };
}
