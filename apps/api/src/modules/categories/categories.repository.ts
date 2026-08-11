import { prisma } from "../../shared/db/prisma.js";

export const categoriesRepository = {
  findRootTree() {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
  },
};
