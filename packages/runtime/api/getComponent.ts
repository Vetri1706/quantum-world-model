import type { RuntimeRepository } from "./RuntimeRepository.js";

export function getComponent(repository: RuntimeRepository, id: string) {
  return repository.requireEntity("component", id);
}
