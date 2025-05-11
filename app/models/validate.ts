import * as v from "valibot";

export class UserError {
  constructor(public message: string) {}
}

export const validate = {
  password: parseFrom(
    v.pipe(
      v.string("Provided password is invalid"),
      v.nonEmpty("Password is required"),
      v.minLength(8, "Password is too short, provide at least 8 characters")
    )
  ),
  email: parseFrom(
    v.message(v.pipe(v.string(), v.email()), "Email is in incorrect format")
  ),
  isError: (input: unknown) => input instanceof UserError,
  getError: (input: unknown) =>
    input instanceof UserError ? input.message : undefined,
};

function parseFrom<
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
>(schema: T) {
  function parse(input: unknown) {
    try {
      return v.parse(schema, input);
    } catch (e) {
      return new UserError((e as v.ValiError<T>).message);
    }
  }
  parse.Schema = schema;
  return parse;
}
