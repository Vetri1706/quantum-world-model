export interface PlaygroundPosition {
  x: number;
  y: number;
}

export interface PlaygroundComponent {
  id: string;
  role: string;
  kind: string;
  asset: string;
  position: PlaygroundPosition;
  rotation?: number;
  editable: boolean;
}

export interface PlaygroundConnection {
  id: string;
  from: string;
  to: string;
  kind: "flow" | "measurement";
}

export interface PlaygroundControl {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  value: number | string | boolean | null;
  minimum?: number | null;
  maximum?: number | null;
  allowedValues?: Array<number | string | boolean>;
}

export interface PlaygroundViewport {
  width: number;
  height: number;
  background: string;
}

/** The renderer contract: no evidence, citations, equations, or runtime object graph. */
export interface PlaygroundModel {
  experimentId: string;
  rendererMode: string;
  readonly components: readonly PlaygroundComponent[];
  readonly connections: readonly PlaygroundConnection[];
  readonly controls: readonly PlaygroundControl[];
  readonly viewport: Readonly<PlaygroundViewport>;
}
