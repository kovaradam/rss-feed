import { prisma } from "~/db.server";

export async function getFailedUploads() {
  return await prisma.failedChannelUpload.findMany();
}

export async function storeFailedUpload(link: string, error: string) {
  return await prisma.failedChannelUpload
    .create({
      data: {
        link: link,
        error: error,
      },
    })
    // Don't really care
    .catch(console.error);
}

export async function deleteFailedUpload(link: string) {
  return await prisma.failedChannelUpload
    .delete({
      where: {
        link: link,
      },
    })
    // Don't really care
    .catch(console.error);
}
