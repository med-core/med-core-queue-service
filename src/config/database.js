import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Prisma conectado a MongoDB Atlas");
  } catch (error) {
    console.error("Error conectando Prisma:", error);
    throw error;
  }
}

export { prisma };