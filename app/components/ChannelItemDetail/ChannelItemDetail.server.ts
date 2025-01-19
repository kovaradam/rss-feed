import invariant from "tiny-invariant";
import { updateChannelItem } from "~/models/channel.server";
import { ChannelItemDetail } from "./ChannelItemDetail";

export const ChannelItemDetailService = {
  async handleAction(userId: string, formData: FormData) {
    const { names, getBooleanValue } = ChannelItemDetail.form;
    const itemId = formData.get(names.itemId);
    invariant(typeof itemId === "string", "Item id was not provided");
    const bookmarked = formData.get(names.bookmarked);
    const read = formData.get(names.read);
    const hiddenFromFeed = formData.get(names.hiddenFromFeed);

    await updateChannelItem(userId, {
      where: {
        id: itemId,
      },
      data: {
        read: getBooleanValue(read),
        bookmarked: getBooleanValue(bookmarked),
        hiddenFromFeed: getBooleanValue(hiddenFromFeed),
      },
    });

    return null;
  },

  isChannelItemUpdate: (formData: FormData) => {
    return formData.get("action") === "update-channel-item";
  },
};
