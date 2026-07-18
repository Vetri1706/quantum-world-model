import type { RuntimeRepository } from "./RuntimeRepository.js";

export function listExperiments(repository: RuntimeRepository) {
  return repository.entities("experiment");
}
