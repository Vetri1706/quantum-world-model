export type PlaygroundMode = "diy" | "guided" | "build";

export const modeCopy: Record<PlaygroundMode, { label: string; description: string }> = {
  diy: { label: "Build Yourself", description: "A quiet sandbox for independent exploration." },
  guided: { label: "Learn with AI", description: "Build the setup while a lab mentor explains and checks it." },
  build: { label: "Generate with AI", description: "Describe an experiment and begin with an AI-built setup." },
};
