import { prisma } from "$lib/prisma/client"
import type { Shop } from "@prisma/client"

export async function getShopById(id: string): Promise<Shop> {
  return prisma.shop.findUnique({
    where: {
      id,
    },
  })
}

export async function getShopByName(name: string): Promise<Shop> {
  return prisma.shop.findUnique({
    where: {
      name,
    },
  })
}
