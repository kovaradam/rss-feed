import { Channel } from "./types.server";

export const ChannelErrors = {
  channelExists: class ChannelExistsError extends Error {
    constructor(public channel: Channel) {
      super();
    }
  },
  invalidUrl: class InvalidUrlError extends Error {},
  htmlNoLinks: class HtmlNoLinksError extends Error {},
  dbUnavailible: class UnavailableDbError extends Error {},
  incorrectDefinition: class IncorrectDefinitionError extends Error {},
};
