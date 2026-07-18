export type SimulationStatus = "idle" | "running" | "paused";

/** UI-facing simulation boundary. A physics package can replace this without changing React or canvas code. */
export class SimulationAdapter {
  public constructor(private status: SimulationStatus = "idle") {}

  public run(): SimulationStatus { this.status = "running"; return this.status; }
  public pause(): SimulationStatus { this.status = "paused"; return this.status; }
  public reset(): SimulationStatus { this.status = "idle"; return this.status; }
}
