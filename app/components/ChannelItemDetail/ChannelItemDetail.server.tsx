import invariant from 'tiny-invariant';
import { updateChannelItem } from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { ChannelItemDetail } from './ChannelItemDetail';

export const ChannelItemDetailService = {
  async handleAction(request: Request) {
    const userId = await requireUserId(request);
    const { names, getBooleanValue } = ChannelItemDetail.form;
    const form = await request.formData();
    const itemId = form.get(names.itemId);
    invariant(typeof itemId === 'string', 'Item id was not provided');

    const bookmarked = form.get(names.bookmarked);
    const read = form.get(names.read);
    const hiddenFromFeed = form.get(names.hiddenFromFeed);

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
};
