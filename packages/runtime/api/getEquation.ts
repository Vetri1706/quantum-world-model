import type { RuntimeRepository } from "./RuntimeRepository.js";

export function getEquation(repository: RuntimeRepository, id: string) {
  return repository.requireEntity("equation", id);
}
