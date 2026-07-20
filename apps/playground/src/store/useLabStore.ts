import { create } from "zustand";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";
import type { SimulationStatus } from "../simulation/SimulationAdapter";

export type LabMode = "diy" | "guided" | "build";

interface LabState {
  mode: LabMode | null;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  selectedIds: string[];
  simulationStatus: SimulationStatus;
  aiGenerating: boolean;
  isAISettingsOpen: boolean;
  isKnowledgeStudioOpen: boolean;
  isTrainingHubOpen: boolean;
  activeRightTab: "inspector" | "ai" | "results" | "progress" | "history";

  setMode: (mode: LabMode | null) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  addInstance: (inst: EquipmentInstance) => void;
  addInstances: (insts: EquipmentInstance[]) => void;
  updateInstance: (id: string, updates: Partial<EquipmentInstance>) => void;
  removeInstance: (id: string) => void;
  removeInstances: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void;
  addConnection: (conn: CanvasConnection) => void;
  removeConnection: (id: string) => void;
  removeConnectionsByInstance: (instanceId: string) => void;
  setConnections: (conns: CanvasConnection[]) => void;
  setInstances: (insts: EquipmentInstance[]) => void;
  setSimulationStatus: (status: SimulationStatus) => void;
  setAiGenerating: (v: boolean) => void;
  setIsAISettingsOpen: (v: boolean) => void;
  setIsKnowledgeStudioOpen: (v: boolean) => void;
  setIsTrainingHubOpen: (v: boolean) => void;
  setActiveRightTab: (tab: "inspector" | "ai" | "results" | "progress" | "history") => void;
  resetLab: () => void;
}

const initialState = {
  mode: null,
  leftCollapsed: false,
  rightCollapsed: false,
  instances: [],
  connections: [],
  selectedIds: [],
  simulationStatus: "idle" as SimulationStatus,
  aiGenerating: false,
  isAISettingsOpen: false,
  isKnowledgeStudioOpen: false,
  isTrainingHubOpen: false,
  activeRightTab: "ai" as const,
};

export const useLabStore = create<LabState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  toggleLeftSidebar: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),

  toggleRightSidebar: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),

  addInstance: (inst) => set((s) => ({ instances: [...s.instances, inst] })),

  addInstances: (insts) => set((s) => ({ instances: [...s.instances, ...insts] })),

  updateInstance: (id, updates) =>
    set((s) => ({
      instances: s.instances.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  removeInstance: (id) =>
    set((s) => ({
      instances: s.instances.filter((i) => i.id !== id),
      connections: s.connections.filter((c) => c.fromId !== id && c.toId !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    })),

  removeInstances: (ids) =>
    set((s) => ({
      instances: s.instances.filter((i) => !ids.includes(i.id)),
      connections: s.connections.filter(
        (c) => !ids.includes(c.fromId) && !ids.includes(c.toId)
      ),
      selectedIds: [],
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  addConnection: (conn) =>
    set((s) => {
      const exists = s.connections.some(
        (c) => c.fromId === conn.fromId && c.fromPort === conn.fromPort && c.toId === conn.toId && c.toPort === conn.toPort
      );
      if (exists) return s;
      return { connections: [...s.connections, conn] };
    }),

  removeConnection: (id) =>
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),

  removeConnectionsByInstance: (instanceId) =>
    set((s) => ({
      connections: s.connections.filter((c) => c.fromId !== instanceId && c.toId !== instanceId),
    })),

  setConnections: (conns) => set({ connections: conns }),

  setInstances: (insts) => set({ instances: insts }),

  setSimulationStatus: (status) => set({ simulationStatus: status }),

  setAiGenerating: (v) => set({ aiGenerating: v }),

  setIsAISettingsOpen: (v) => set({ isAISettingsOpen: v }),

  setIsKnowledgeStudioOpen: (v) => set({ isKnowledgeStudioOpen: v }),

  setIsTrainingHubOpen: (v) => set({ isTrainingHubOpen: v }),

  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  resetLab: () =>
    set({
      instances: [],
      connections: [],
      selectedIds: [],
      simulationStatus: "idle",
    }),
}));
