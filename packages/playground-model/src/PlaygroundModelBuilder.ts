import type { ResolvedExperiment } from "@quantum-playground/runtime";

import type {
  PlaygroundComponent,
  PlaygroundConnection,
  PlaygroundControl,
  PlaygroundModel,
  PlaygroundViewport,
} from "./PlaygroundModel.js";

type RuntimeComponent = { id: string; component_kind: string; renderer_asset?: string | null };
type ComponentPlacement = Omit<PlaygroundComponent, "position">;

/**
 * An immutable runtime-to-renderer adapter. Each `with…` method returns a new
 * builder, allowing consumers to insert specialised resolvers for new experiments.
 */
export class PlaygroundModelBuilder {
  private constructor(
    private readonly experiment: ResolvedExperiment,
    private readonly components: PlaygroundComponent[] = [],
    private readonly connections: PlaygroundConnection[] = [],
    private readonly controls: PlaygroundControl[] = [],
    private readonly viewport?: PlaygroundViewport,
  ) {}

  public static fromExperiment(experiment: ResolvedExperiment): PlaygroundModelBuilder {
    return new PlaygroundModelBuilder(experiment);
  }

  public withDefaultLayout(): PlaygroundModelBuilder {
    const placements = this.runtimeComponents().map((item, index): PlaygroundComponent => ({
      ...this.mapComponent(item),
      position: { x: 160 + index * 240, y: 260 },
    }));
    return new PlaygroundModelBuilder(this.experiment, placements, this.connections, this.controls, this.viewport);
  }

  public withRendererAssets(): PlaygroundModelBuilder {
    const components = this.components.length ? this.components : this.runtimeComponents().map(item => ({ ...this.mapComponent(item), position: { x: 0, y: 0 } }));
    return new PlaygroundModelBuilder(this.experiment, components, this.connections, this.controls, this.viewport);
  }

  public withControls(): PlaygroundModelBuilder {
    const controls = this.experiment.configuration.parameters.map(parameter => ({
      id: parameter.id,
      label: parameter.label,
      quantity: parameter.quantity,
      unit: parameter.unit,
      value: parameter.default,
      minimum: parameter.minimum,
      maximum: parameter.maximum,
      allowedValues: parameter.allowed_values,
    }));
    return new PlaygroundModelBuilder(this.experiment, this.components, this.connections, controls, this.viewport);
  }

  public withConnections(): PlaygroundModelBuilder {
    const components = this.components.length ? this.components : this.runtimeComponents().map(item => ({ ...this.mapComponent(item), position: { x: 0, y: 0 } }));
    const connections = components.slice(1).map((component, index) => ({
      id: `${components[index].id}-to-${component.id}`,
      from: components[index].id,
      to: component.id,
      kind: component.kind === "detector" ? "measurement" as const : "flow" as const,
    }));
    return new PlaygroundModelBuilder(this.experiment, components, connections, this.controls, this.viewport);
  }

  public withViewport(): PlaygroundModelBuilder {
    const componentCount = this.components.length || this.runtimeComponents().length;
    const viewport = { width: Math.max(960, componentCount * 260 + 160), height: 560, background: "#0b1020" };
    return new PlaygroundModelBuilder(this.experiment, this.components, this.connections, this.controls, viewport);
  }

  public build(): Readonly<PlaygroundModel> {
    if (!this.components.length) throw new Error("A PlaygroundModel requires withDefaultLayout() or withRendererAssets().");
    if (!this.viewport) throw new Error("A PlaygroundModel requires withViewport().");
    return Object.freeze({
      experimentId: this.experiment.id,
      rendererMode: this.experiment.renderer?.mode ?? "canvas-2d",
      components: Object.freeze([...this.components]),
      connections: Object.freeze([...this.connections]),
      controls: Object.freeze([...this.controls]),
      viewport: Object.freeze({ ...this.viewport }),
    });
  }

  private runtimeComponents(): Array<{ component: RuntimeComponent; role: string; required: boolean }> {
    // QRT resolves this field to component objects. The public QRT type remains
    // schema-compatible while the adapter intentionally consumes the runtime graph.
    return this.experiment.configuration.components as unknown as Array<{ component: RuntimeComponent; role: string; required: boolean }>;
  }

  private mapComponent(item: { component: RuntimeComponent; role: string; required: boolean }): ComponentPlacement {
    return {
      id: item.component.id,
      role: item.role,
      kind: item.component.component_kind,
      asset: item.component.renderer_asset ?? item.component.component_kind,
      editable: !item.required,
    };
  }
}
