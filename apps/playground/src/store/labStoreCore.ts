import { create } from "zustand";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";
import {
  AIMentorConfig,
  defaultConfig as defaultAIConfig,
} from "../services/aiMentorService";
import {
  QWMExperiment,
  defaultQuantumTunnelingExperiment,
  defaultWaveInterferenceExperiment,
  defaultNewtonsCradleExperiment,
  defaultCrystalCapsuleExperiment,
  defaultMachZehnderExperiment,
  defaultSternGerlachExperiment,
  defaultPhotoelectricExperiment,
  defaultRutherfordExperiment,
} from "../services/qwmDataLoader";

export type ScreenId = 1 | 2 | 3 | 4 | 5;
export type LabMode = "ai_builder" | "free_sandbox";

export interface PhysicsState {
  barrierHeight: number;
  barrierWidth: number;
  incidentEnergy: number;
  particleMass: number;
  transmissionProb: number;
  densityArray: number[];
  xArray: number[];
  wavelength: number;
  slitSeparation: number;
  slitWidth: number;
  intensityArray: number[];
}

export interface ConstraintDef {
  type: "distance" | "revolute" | "prismatic" | "spring";
  targetEntityId: string;
  params: Record<string, number>;
}

export interface PhysicsBody {
  type: "static" | "dynamic" | "kinematic";
  mass?: number;
  collisionShape?: "box" | "cylinder" | "sphere" | "convex" | "trimesh";
  constraints?: ConstraintDef[];
}

export type LabEntity = {
  id: string;
  definitionId: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  physicsBody?: PhysicsBody;
  parameters: Record<string, unknown>;
  ports: Array<{
    id: string;
    type: "input" | "output";
    kind: "beam" | "signal";
  }>;
  metadata: {
    label: string;
    source: "manual" | "preset" | "imported";
  };
};

interface SimulationState {
  isRunning: boolean;
  speed: number;
  fixedTimeStep: number;
  maxSubSteps: number;
}

interface HistoryEntry {
  id: string;
  experimentId: QWMExperiment;
  timestamp: number;
  entities: LabEntity[];
  connections: CanvasConnection[];
  simulationState: SimulationState;
  discoveries: string[];
}

export type MentorMessage = {
  id: string;
  sender: "mentor" | "user";
  text: string;
  timestamp: string;
};

const defaultPhysicsState: PhysicsState = {
  barrierHeight: 5.0,
  barrierWidth: 1.0,
  incidentEnergy: 1.0,
  particleMass: 1.0,
  transmissionProb: 0.15,
  densityArray: [],
  xArray: [],
  wavelength: 500,
  slitSeparation: 2.0,
  slitWidth: 0.5,
  intensityArray: [],
};

const createDefaultEquipmentPositions = (): Record<string, [number, number, number]> => ({
  "electron-source": [-4.5, 0, 0],
  "potential-barrier": [0, 0, 0],
  detector: [4.2, 0, 0],
  "laser-source": [-4.5, 0, -2],
  "double-slit-mask": [0, 0, -2],
  "screen-detector": [4.2, 0, -2],
  "atomic-source": [-4.5, 0, 0],
  "crystal-capsule": [0, 0, 0],
  "nuclear-reactor": [0, 0, -2],
  "solenoid-magnet": [-2, 0, 2],
  "riemann-sphere": [2.5, 0, 1.5],
  "bunsen-burner": [3.5, 0, 2],
  beaker: [2, 0, 2],
});

const experimentLookup: Record<string, QWMExperiment> = {
  "quantum-tunneling": defaultQuantumTunnelingExperiment,
  "wave-interference": defaultWaveInterferenceExperiment,
  "newtons-cradle": defaultNewtonsCradleExperiment,
  "crystal-capsule": defaultCrystalCapsuleExperiment,
  "mach-zehnder": defaultMachZehnderExperiment,
  "stern-gerlach": defaultSternGerlachExperiment,
  "photoelectric-effect": defaultPhotoelectricExperiment,
  "rutherford-scattering": defaultRutherfordExperiment,
};

const defaultLabState = {
  labMode: "ai_builder" as "ai_builder" | "free_sandbox",
  currentScreen: 1 as ScreenId,
  activeExperiment: defaultQuantumTunnelingExperiment,
  installedEquipment: [] as string[],
  selectedEquipmentId: null as string | null,
  equipmentPositions: createDefaultEquipmentPositions(),
  missingEquipment: [] as string[],
  physicsState: defaultPhysicsState,
  aiConfig: defaultAIConfig,
  availableOllamaModels: [] as string[],
  mentorFeed: [
    {
      id: "1",
      sender: "mentor" as "mentor" | "user",
      text: "Welcome to Quantum Lab! Select equipment from the shelf to add them to your 3D stage.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  observedDiscoveries: [] as string[],
  mode: null as LabMode | null,
  leftCollapsed: false,
  rightCollapsed: false,
  instances: [] as EquipmentInstance[],
  sceneEntities: {} as Record<string, LabEntity>,
  connections: [] as CanvasConnection[],
  selectedIds: [] as string[],
  selectedEntityIds: [] as string[],
  entities: new Map<string, LabEntity>(),
  simulation: { isRunning: false, speed: 1, fixedTimeStep: 1 / 120, maxSubSteps: 4 },
  viewport: { cameraPosition: [0, 4.2, 11], cameraTarget: [0, 0, 0], fov: 42 },
  simulationStatus: "idle" as "idle" | "running" | "paused",
  simulationSpeed: 1,
  aiGenerating: false,
  isAISettingsOpen: false,
  isKnowledgeStudioOpen: false,
  isTrainingHubOpen: false,
  activeRightTab: "ai" as string,
  activePanel: "library" as string,
  rightSidebarTab: "inspector" as string,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  mentorMessages: [] as Array<{ id: string; sender: "mentor" | "user"; text: string; timestamp: string; context?: Record<string, unknown> }>,
  experimentHistory: [] as HistoryEntry[],
};

const toSceneEntity = (instance: EquipmentInstance): LabEntity => ({
  id: instance.id,
  definitionId: instance.definitionId,
  transform: {
    position: [instance.position.x, 0, instance.position.y],
    rotation: [0, 0, (instance.rotation * Math.PI) / 180],
    scale: [instance.size.width, 1, instance.size.height],
  },
  parameters: { ...instance.parameters },
  ports: [],
  metadata: { label: instance.name, source: "manual" },
});

const mapInstancesToSceneEntities = (instances: EquipmentInstance[]) =>
  instances.reduce<Record<string, LabEntity>>((entities, instance) => {
    entities[instance.id] = toSceneEntity(instance);
    return entities;
  }, {});

type LabStore = typeof defaultLabState & {
  setLabMode: (mode: "ai_builder" | "free_sandbox") => void;
  setScreen: (screen: ScreenId) => void;
  selectExperiment: (expId: string) => void;
  setSelectedEquipment: (id: string | null) => void;
  setInstalledEquipment: (components: string[]) => void;
  addEquipment: (comp: string) => void;
  removeEquipment: (comp: string) => void;
  toggleEquipment: (comp: string) => void;
  updateEquipmentPosition: (id: string, pos: [number, number, number]) => void;
  resetEquipmentPositions: () => void;
  updatePhysicsParams: (params: Partial<PhysicsState>) => void;
  updatePhysicsSimulation: (density: number[], xArr: number[], transmission: number) => void;
  updateInterferenceSimulation: (intensity: number[]) => void;
  updateAIConfig: (config: Partial<AIMentorConfig>) => void;
  setOllamaModels: (models: string[]) => void;
  addMentorMessage: (msg: string, sender?: "mentor" | "user") => void;
  checkEquipmentIntegrity: () => boolean;
  addDiscovery: (discovery: string) => void;
  setMode: (mode: LabMode | null) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setSimulationStatus: (status: "idle" | "running" | "paused") => void;
  setAiGenerating: (v: boolean) => void;
  setIsAISettingsOpen: (v: boolean) => void;
  setIsKnowledgeStudioOpen: (v: boolean) => void;
  setIsTrainingHubOpen: (v: boolean) => void;
  setActiveRightTab: (tab: string) => void;
  setActivePanel: (panel: string) => void;
  setRightSidebarTab: (tab: string) => void;
  resetLab: () => void;
  resetLabState: () => void;
  setEntityTransform: (id: string, transform: Partial<LabEntity["transform"]>) => void;
  setEntityPosition: (id: string, position: [number, number, number]) => void;
  toggleEntitySelection: (id: string) => void;
  removeEntity: (id: string) => void;
  addInstance: (instance: EquipmentInstance) => void;
  addInstances: (instances: EquipmentInstance[]) => void;
  updateInstance: (id: string, updates: Partial<EquipmentInstance>) => void;
  removeInstance: (id: string) => void;
  removeInstances: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void;
  addConnection: (connection: CanvasConnection) => void;
  removeConnection: (id: string) => void;
  removeConnectionsByInstance: (instanceId: string) => void;
  setConnections: (connections: CanvasConnection[]) => void;
  setInstances: (instances: EquipmentInstance[]) => void;
  applyGeneratedSetup: (instances: EquipmentInstance[], connections: CanvasConnection[]) => void;
};

export const useQuantumLabStore = create<LabStore>((set, get) => ({
  ...defaultLabState,

  setLabMode: (mode) => set({ labMode: mode }),
  setScreen: (screen) => set({ currentScreen: screen }),
  selectExperiment: (expId) => {
    const activeExperiment = experimentLookup[expId] ?? defaultQuantumTunnelingExperiment;
    set({
      activeExperiment,
      installedEquipment: [],
      instances: [],
      sceneEntities: {},
      connections: [],
      selectedIds: [],
      selectedEntityIds: [],
      selectedEquipmentId: null,
      missingEquipment: [],
      equipmentPositions: createDefaultEquipmentPositions(),
      currentScreen: 2,
    });
  },
  setSelectedEquipment: (id) => set({ selectedEquipmentId: id }),
  setInstalledEquipment: (components) => set({ installedEquipment: [...components], selectedEquipmentId: null, missingEquipment: [] }),
  addEquipment: (comp) => {
    const installed = get().installedEquipment;
    if (installed.includes(comp)) return;
    set({ installedEquipment: [...installed, comp], selectedEquipmentId: comp });
    get().checkEquipmentIntegrity();
  },
  removeEquipment: (comp) => {
    const updated = get().installedEquipment.filter((c) => c !== comp);
    const selected = get().selectedEquipmentId === comp ? null : get().selectedEquipmentId;
    set({ installedEquipment: updated, selectedEquipmentId: selected });
    get().checkEquipmentIntegrity();
  },
  toggleEquipment: (comp) => {
    if (get().installedEquipment.includes(comp)) get().removeEquipment(comp);
    else get().addEquipment(comp);
  },
  updateEquipmentPosition: (id, pos) => set((state) => ({ equipmentPositions: { ...state.equipmentPositions, [id]: pos } })),
  resetEquipmentPositions: () => set({ equipmentPositions: createDefaultEquipmentPositions() }),
  updatePhysicsParams: (params) => set((state) => ({ physicsState: { ...state.physicsState, ...params } })),
  updatePhysicsSimulation: (density, xArr, transmission) => set((state) => ({ physicsState: { ...state.physicsState, densityArray: density, xArray: xArr, transmissionProb: transmission } })),
  updateInterferenceSimulation: (intensity) => set((state) => ({ physicsState: { ...state.physicsState, intensityArray: intensity } })),
  updateAIConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
  setOllamaModels: (models) => set({ availableOllamaModels: models }),
  addMentorMessage: (text, sender = "mentor") => {
    const newMsg: MentorMessage = { id: Date.now().toString(), sender, text, timestamp: new Date().toLocaleTimeString() };
    set((state) => ({ mentorFeed: [newMsg, ...state.mentorFeed].slice(0, 30) }));
  },
  checkEquipmentIntegrity: () => {
    const { activeExperiment, installedEquipment } = get();
    const required = activeExperiment.configuration.components.filter((component) => component.required).map((component) => component.component);
    const missing = required.filter((component) => !installedEquipment.includes(component));
    set({ missingEquipment: missing });
    return missing.length === 0;
  },
  addDiscovery: (discovery) => {
    if (!get().observedDiscoveries.includes(discovery)) {
      set((state) => ({ observedDiscoveries: [...state.observedDiscoveries, discovery] }));
    }
  },
  setMode: (mode) => set({ mode }),
  toggleLeftSidebar: () => set((state) => ({ leftCollapsed: !state.leftCollapsed })),
  toggleRightSidebar: () => set((state) => ({ rightCollapsed: !state.rightCollapsed })),
  setSimulationStatus: (status) => set({ simulationStatus: status }),
  setAiGenerating: (v) => set({ aiGenerating: v }),
  setIsAISettingsOpen: (v) => set({ isAISettingsOpen: v }),
  setIsKnowledgeStudioOpen: (v) => set({ isKnowledgeStudioOpen: v }),
  setIsTrainingHubOpen: (v) => set({ isTrainingHubOpen: v }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
  resetLabState: () => {
    const exp = get().activeExperiment;
    set({ installedEquipment: exp.configuration.components.map((component) => component.component), missingEquipment: [], currentScreen: 1, selectedEquipmentId: null });
  },
  addInstance: (inst: EquipmentInstance) => set((state) => {
    const instances = [...state.instances, inst];
    return { instances, sceneEntities: mapInstancesToSceneEntities(instances) };
  }),
  addInstances: (insts: EquipmentInstance[]) => set((state) => {
    const instances = [...state.instances, ...insts];
    return { instances, sceneEntities: mapInstancesToSceneEntities(instances) };
  }),
  updateInstance: (id: string, updates: Partial<EquipmentInstance>) => set((state) => {
    const instances = state.instances.map((instance) => (instance.id === id ? { ...instance, ...updates } : instance));
    return { instances, sceneEntities: mapInstancesToSceneEntities(instances) };
  }),
  removeInstance: (id: string) => set((state) => {
    const instances = state.instances.filter((instance) => instance.id !== id);
    return { instances, sceneEntities: mapInstancesToSceneEntities(instances), connections: state.connections.filter((connection) => connection.fromId !== id && connection.toId !== id), selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id), selectedEntityIds: state.selectedEntityIds.filter((selectedId) => selectedId !== id) };
  }),
  removeInstances: (ids: string[]) => set((state) => {
    const instances = state.instances.filter((instance) => !ids.includes(instance.id));
    return { instances, sceneEntities: mapInstancesToSceneEntities(instances), connections: state.connections.filter((connection) => !ids.includes(connection.fromId) && !ids.includes(connection.toId)), selectedIds: [], selectedEntityIds: [] };
  }),
  setSelectedIds: (ids: string[]) => set({ selectedIds: ids, selectedEntityIds: ids }),
  addConnection: (conn: CanvasConnection) => set((state) => {
    const exists = state.connections.some((connection) => connection.fromId === conn.fromId && connection.fromPort === conn.fromPort && connection.toId === conn.toId && connection.toPort === conn.toPort);
    if (exists) return state;
    return { connections: [...state.connections, conn] };
  }),
  removeConnection: (id: string) => set((state) => ({ connections: state.connections.filter((connection) => connection.id !== id) })),
  removeConnectionsByInstance: (instanceId: string) => set((state) => ({ connections: state.connections.filter((connection) => connection.fromId !== instanceId && connection.toId !== instanceId) })),
  setConnections: (conns: CanvasConnection[]) => set({ connections: conns }),
  setInstances: (insts: EquipmentInstance[]) => set({ instances: insts, sceneEntities: mapInstancesToSceneEntities(insts) }),
  applyGeneratedSetup: (insts, conns) => set(() => {
    const equipmentIds = [...new Set(insts.map((instance) => instance.definitionId))];
    const equipmentPositions = insts.reduce<Record<string, [number, number, number]>>((positions, instance) => {
      positions[instance.definitionId] = [instance.position.x / 50, 0, instance.position.y / 50];
      return positions;
    }, createDefaultEquipmentPositions());
    return {
      instances: insts,
      sceneEntities: mapInstancesToSceneEntities(insts),
      connections: conns,
      installedEquipment: equipmentIds,
      selectedIds: [],
      selectedEntityIds: [],
      selectedEquipmentId: null,
      equipmentPositions,
      missingEquipment: [],
    };
  }),
  resetLab: () => set({ instances: [], sceneEntities: {}, connections: [], selectedIds: [], selectedEntityIds: [], simulationStatus: "idle" }),
  setEntityTransform: (id, transform) => set((state) => {
    const entity = state.entities.get(id);
    if (!entity) return state;
    const updated = new Map(state.entities);
    updated.set(id, { ...entity, transform: { ...entity.transform, ...transform } });
    return { entities: updated };
  }),
  setEntityPosition: (id, position) => set((state) => {
    const entity = state.entities.get(id);
    if (!entity) return state;
    const updated = new Map(state.entities);
    updated.set(id, { ...entity, transform: { ...entity.transform, position } });
    return { entities: updated };
  }),
  toggleEntitySelection: (id) => set((state) => ({
    selectedEntityIds: state.selectedEntityIds.includes(id)
      ? state.selectedEntityIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedEntityIds, id],
  })),
  removeEntity: (id) => set((state) => {
    const entities = new Map(state.entities);
    entities.delete(id);
    return { entities, selectedEntityIds: state.selectedEntityIds.filter((selectedId) => selectedId !== id) };
  }),
}));

export const useLabStore = useQuantumLabStore;
export const useUnifiedLabStore = useQuantumLabStore;
