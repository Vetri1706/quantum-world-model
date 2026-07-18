import type { RuntimeRepository } from "./RuntimeRepository.js";

export function getConcept(repository: RuntimeRepository, id: string) {
  return repository.requireEntity("concept", id);
}
