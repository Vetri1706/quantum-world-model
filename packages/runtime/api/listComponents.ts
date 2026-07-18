import type { RuntimeRepository } from "./RuntimeRepository.js";

export function listComponents(repository: RuntimeRepository) {
  return repository.entities("component");
}
