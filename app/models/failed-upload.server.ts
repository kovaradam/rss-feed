import { prisma } from "~/db.server";

export async function getFailedUploads() {
  return await prisma.failedChannelUpload.findMany();
}

export async function storeFailedUpload(link: string, error: unknown) {
  return await prisma.failedChannelUpload
    .create({
      data: {
        link: link,
        error:
          error instanceof Error
            ? `${error.name}|${error.message}|${error.stack}`
            : String(error),
      },
    })
    // Don't really care
    .catch(console.error);
}

export async function deleteFailedUpload(id: string) {
  return await prisma.failedChannelUpload
    .delete({
      where: {
        id: id,
      },
    })
    // Don't really care
    .catch(console.error);
}
