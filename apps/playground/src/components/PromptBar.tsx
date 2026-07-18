import React, { useState } from "react";

type PromptBarProps = {
  onGenerate: (prompt: string) => void;
  isLoading?: boolean;
};

export const PromptBar: React.FC<PromptBarProps> = ({ onGenerate, isLoading = false }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onGenerate(prompt);
  };

  const setPresetPrompt = (text: string) => {
    setPrompt(text);
    onGenerate(text);
  };

  return (
    <div className="prompt-bar-container">
      <form className="prompt-bar-form" onSubmit={handleSubmit}>
        <div className="prompt-spark-icon">✦</div>
        <input
          type="text"
          placeholder="Ask AI: 'Create a quantum tunneling experiment' or 'Build a double-slit diffraction'..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          aria-label="Experiment Prompt"
        />
        <button type="submit" className="prompt-submit-btn" disabled={isLoading || !prompt.trim()}>
          {isLoading ? "Generating..." : "Generate Lab Setup →"}
        </button>
      </form>

      <div className="prompt-quick-presets">
        <span>Try:</span>
        <button onClick={() => setPresetPrompt("Create a quantum tunneling experiment")}>
          Quantum Tunneling
        </button>
        <button onClick={() => setPresetPrompt("Build a double-slit experiment")}>
          Double Slit
        </button>
        <button onClick={() => setPresetPrompt("Setup a polarization filter lab")}>
          Polarization Filter
        </button>
        <button onClick={() => setPresetPrompt("Create a Michelson interferometer")}>
          Michelson Interferometer
        </button>
      </div>
    </div>
  );
};
