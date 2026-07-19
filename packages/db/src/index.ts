import { env } from "@GameXL/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import {
	PrismaClient,
	Prisma as PrismaNamespace,
} from "../prisma/generated/client";

export const Prisma = PrismaNamespace;

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});
	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
