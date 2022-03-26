import * as Prisma from "@prisma/client";

let PrismaPkg = Prisma;

if (typeof Prisma.PrismaClient !== "function") {
  PrismaPkg = (Prisma as any).default;
}

const { PrismaClient } = PrismaPkg;

export const prisma = new PrismaClient();
