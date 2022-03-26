import { prisma } from "$lib/database/client"

export async function processAppUninstalled (topic: string, shop_name: string, body: string) {
  const shop = await prisma.shop.findUnique({
    where: { name: shop_name },
  })

  if (!shop) {
    throw new Error("Access denied")
  }

  await prisma.shop.delete({
    where: {
      name: shop_name,
    },
  })

}

export async function processProductUpdated (topic: string, shop_name: string, body: string) {
  console.log(topic, shop_name, body)
}

export async function processProductDeleted (topic: string, shop_name: string, body: string) {
  console.log(topic, shop_name, body)
}
