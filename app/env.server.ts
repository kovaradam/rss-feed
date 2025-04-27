import invariant from "tiny-invariant";
import { mapValue } from "./utils/map-value";

export const SERVER_ENV = {
  is: {
    prod: process.env.NODE_ENV === "production",
  },
  domain: mapValue(process.env.SERVER_DOMAIN)(
    (domain) => (invariant(domain, "missing server domain!"), domain)
  ),
  sessionSecret: mapValue(process.env.SESSION_SECRET)(
    (secret) => (invariant(secret, "missing session secret!"), secret)
  ),
  mail: {
    smtpUrl: mapValue(process.env.SMTP_URL)(
      (url) => (invariant(url, "missing email smtp url!"), url)
    ),
    user: mapValue(process.env.MAIL_USER)(
      (user) => (invariant(user, "missing email user!"), user)
    ),
    password: mapValue(process.env.MAIL_PASS)(
      (password) => (invariant(password, "missing email password!"), password)
    ),
  },
  admin: {
    email: mapValue(process.env.ADMIN_EMAIL)(
      (email) => (invariant(email, "missing admin email!"), email)
    ),
    password: mapValue(process.env.ADMIN_PASS)(
      (password) => (invariant(password, "missing admin password!"), password)
    ),
  },
};
