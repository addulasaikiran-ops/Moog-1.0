import { prisma } from "../lib/prisma";

const result = await prisma.share.deleteMany({ where: { expiresAt: { lte: new Date() } } });
console.log(JSON.stringify({ deletedShares: result.count }));
await prisma.$disconnect();
