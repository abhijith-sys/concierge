import { categoriesRepository } from "./categories.repository.js";

export const categoriesService = {
  listTree() {
    return categoriesRepository.findRootTree();
  },
};
