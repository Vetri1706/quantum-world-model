import type { RuntimeRepository } from "./RuntimeRepository.js";

export function resolveExperiment(repository: RuntimeRepository, id: string) {
  return repository.requireExperiment(id);
}
