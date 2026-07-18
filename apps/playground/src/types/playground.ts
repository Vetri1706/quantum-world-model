/** Browser-safe re-export of the existing PlaygroundModel renderer contract. */
export type {
  PlaygroundComponent,
  PlaygroundConnection,
  PlaygroundControl,
  PlaygroundModel,
  PlaygroundPosition,
  PlaygroundViewport,
} from "../../../../packages/playground-model/src/PlaygroundModel";

export interface PortDefinition {
  id: string;
  label: string;
  type: "input" | "output";
  kind: "beam" | "signal";
  position: { x: number; y: number }; // percentage of component width/height (0-100)
}

export interface InspectorField {
  id: string;
  label: string;
  type: "number" | "boolean" | "select" | "string";
  defaultValue: any;
  unit?: string;
  minimum?: number;
  maximum?: number;
  step?: number;
  allowedValues?: any[];
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  category:
    | "Quantum Sources"
    | "Quantum Objects"
    | "Optical Components"
    | "Measurement"
    | "Environment"
    | "Fields"
    | "Visualization"
    | "Analysis"
    | "Utilities";
  icon: string;
  svg: string; // identifier key for inline SVG component
  description: string;
  defaultSize: { width: number; height: number };
  difficulty: number; // Operation difficulty (1-5 stars)
  supports: string[];  // Physics features supported, e.g. ["Quantum Tunneling"]
  inspector: InspectorField[];
  ports: PortDefinition[];
  placementRules: string[];
  simulationHook: string;
  rendererHook: string;
  compatibleExperiments: string[];
}

export interface EquipmentInstance {
  id: string;
  definitionId: string;
  name: string;
  position: { x: number; y: number };
  rotation: number; // in degrees (0-360)
  size: { width: number; height: number };
  parameters: Record<string, any>;
}

export interface CanvasConnection {
  id: string;
  fromId: string;
  fromPort: string;
  toId: string;
  toPort: string;
  kind: "flow" | "measurement";
}

