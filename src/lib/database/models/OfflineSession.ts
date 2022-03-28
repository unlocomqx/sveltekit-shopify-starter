import { prisma } from "$lib/database/client";

export async function getOfflineToken(shop_name: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: {
        name: shop_name,
      },
      include: {
        offline_session: true,
      },
    });

    return shop.offline_session.accessToken;
  } catch (error) {
    return null;
  }
}
