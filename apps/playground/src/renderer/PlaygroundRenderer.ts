import type { PlaygroundComponent, PlaygroundConnection, PlaygroundModel, PlaygroundPosition } from "../types/playground";

export type RenderComponent = PlaygroundComponent & { position: PlaygroundPosition };

/** Pure rendering state: it never knows about React, RuntimeRepository, or physics solvers. */
export class PlaygroundRenderer {
  public constructor(private readonly model: PlaygroundModel) {}

  public components(overrides: ReadonlyMap<string, PlaygroundPosition>): RenderComponent[] {
    return this.model.components.map(component => ({ ...component, position: overrides.get(component.id) ?? component.position }));
  }

  public connections(): readonly PlaygroundConnection[] { return this.model.connections; }
}
