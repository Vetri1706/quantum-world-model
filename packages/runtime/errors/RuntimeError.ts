export class RuntimeError extends Error {
  public constructor(message: string, public readonly path?: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class RepositoryValidationError extends RuntimeError {}
export class DuplicateEntityError extends RuntimeError {}
export class MissingEntityError extends RuntimeError {}
export class ReferenceResolutionError extends RuntimeError {}
export class CycleError extends RuntimeError {}
