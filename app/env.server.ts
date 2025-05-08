import * as v from "valibot";
import "dotenv/config";

const EnvSchema = v.object({
  domain: v.message(v.pipe(v.string(), v.nonEmpty()), "missing server domain!"),
  sessionSecret: v.message(
    v.pipe(v.string(), v.nonEmpty()),
    "missing session secret!"
  ),
  mail: v.object({
    smtpUrl: v.message(
      v.pipe(v.string(), v.nonEmpty()),
      "missing email smtp url!"
    ),
    user: v.message(v.pipe(v.string(), v.nonEmpty()), "missing email user!"),
    password: v.message(
      v.pipe(v.string(), v.nonEmpty()),
      "missing email password!"
    ),
  }),
  admin: v.object({
    email: v.message(v.pipe(v.string(), v.nonEmpty()), "missing admin email!"),
    password: v.message(
      v.pipe(v.string(), v.nonEmpty()),
      "missing admin password!"
    ),
  }),
});

export const SERVER_ENV = {
  is: {
    prod: process.env.NODE_ENV === "production",
  },
  ...v.parse(EnvSchema, {
    domain: process.env.SERVER_DOMAIN,
    sessionSecret: process.env.SESSION_SECRET,
    mail: {
      smtpUrl: process.env.SMTP_URL,
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASS,
    },
    admin: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASS,
    },
  }),
};
