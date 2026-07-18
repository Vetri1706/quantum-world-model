import React, { useState } from "react";
import { equipmentRegistry } from "../data/equipmentRegistry";
import type { EquipmentDefinition } from "../types/playground";
import { EquipmentSVG } from "../canvas/EquipmentSVG";

type LibraryProps = {
  onDragStart: (event: React.DragEvent, definitionId: string) => void;
  onAddEquipment: (def: EquipmentDefinition) => void;
  onLoadPreset: (presetName: string) => void;
};

export const EquipmentLibrary: React.FC<LibraryProps> = ({
  onDragStart,
  onAddEquipment,
  onLoadPreset,
}) => {
  const [activeTab, setActiveTab] = useState<"equipment" | "experiments">("equipment");
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [width, setWidth] = useState(280);

  // Categories list
  const categories = [
    "Quantum Sources",
    "Quantum Objects",
    "Optical Components",
    "Measurement",
    "Environment",
    "Fields",
    "Visualization",
    "Analysis",
    "Utilities",
  ] as const;

  // Preset experiments list
  const presetExperiments = [
    {
      name: "Quantum Tunneling Setup",
      description: "Observe matter-wave tunneling through a potential barrier.",
      equipment: ["Electron Gun", "Potential Barrier", "Quantum Detector", "Wave Plotter"],
      difficultyLabel: "Intermediate",
      stars: 4,
      time: "10 min",
      supports: ["Quantum Tunneling", "Wave Packet"],
      icon: "⌁",
    },
    {
      name: "Young's Double Slit",
      description: "Watch single photons interfere as coherent wave fronts.",
      equipment: ["Photon Source", "Double Slit", "Phosphor Screen"],
      difficultyLabel: "Intermediate",
      stars: 3,
      time: "8 min",
      supports: ["Double Slit", "Interference"],
      icon: "‖</",
    },
    {
      name: "Michelson Interferometer",
      description: "Split and recombine laser beams to observe fringe shifts.",
      equipment: ["Laser Diode", "Beam Splitter", "Mirror (×2)", "Detector"],
      difficultyLabel: "Advanced",
      stars: 5,
      time: "15 min",
      supports: ["Interferometry", "Phase Shifts"],
      icon: "⧉",
    },
    {
      name: "Polarization Filter Lab",
      description: "Experiment with Malus's Law and wave retarders.",
      equipment: ["Laser Diode", "Polarizing Filter", "Phase Plate", "Detector"],
      difficultyLabel: "Advanced",
      stars: 4,
      time: "12 min",
      supports: ["Polarization", "Malus's Law", "Qubit Projections"],
      icon: "⎊",
    },
  ];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Drag resizer handle logic
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(240, Math.min(500, startWidth + (moveEvent.clientX - startX)));
      setWidth(nextWidth);
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const filteredRegistry = equipmentRegistry.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <span className="difficulty-stars" title={`Difficulty: ${rating}/5`}>
        {"★".repeat(rating) + "☆".repeat(5 - rating)}
      </span>
    );
  };

  return (
    <aside className="equipment-library" style={{ width }}>
      {/* TABS SELECTOR AT TOP */}
      <div className="library-tabs">
        <button
          className={`tab-btn ${activeTab === "experiments" ? "active" : ""}`}
          onClick={() => setActiveTab("experiments")}
        >
          ☄ Experiments
        </button>
        <button
          className={`tab-btn ${activeTab === "equipment" ? "active" : ""}`}
          onClick={() => setActiveTab("equipment")}
        >
          ⚙ Equipment
        </button>
      </div>

      <div className="library-header">
        {activeTab === "equipment" ? (
          <>
            <p className="eyebrow">DRAG LAB INSTRUMENTS</p>
            <input
              type="text"
              placeholder="Search instruments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              aria-label="Search equipment"
            />
          </>
        ) : (
          <>
            <p className="eyebrow">CHOOSE LABORATORY PRESETS</p>
            <p className="tab-hint-text">Click a template below to deploy it onto your workbench.</p>
          </>
        )}
      </div>

      {/* RENDER EQUIPMENT TAB */}
      {activeTab === "equipment" ? (
        <div className="categories-list">
          {categories.map((category) => {
            const items = filteredRegistry.filter((item) => item.category === category);
            if (items.length === 0 && search !== "") return null;

            const isCollapsed = collapsedCategories[category];

            return (
              <div key={category} className={`category-group ${isCollapsed ? "is-collapsed" : ""}`}>
                <button className="category-toggle" onClick={() => toggleCategory(category)}>
                  <span className="toggle-icon">{isCollapsed ? "▶" : "▼"}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-count">{items.length}</span>
                </button>

                {!isCollapsed && (
                  <div className="category-items">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="library-item rich-card"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/react-flow", item.id);
                          e.dataTransfer.setData("text/plain", item.id);
                          e.dataTransfer.effectAllowed = "all";
                          onDragStart(e, item.id);
                        }}
                        onClick={(e) => {
                          // Prevent triggering if clicked on button (which has its own handler)
                          if ((e.target as HTMLElement).closest(".add-quick-btn")) return;
                          onAddEquipment(item);
                        }}
                        title={`Drag or click to add ${item.name} to laboratory workbench`}
                      >
                        <div className="item-row-top">
                          <div className="item-mini-preview">
                            <EquipmentSVG
                              svgId={item.svg}
                              width={50}
                              height={30}
                              parameters={item.inspector.reduce((acc, field) => {
                                acc[field.id] = field.defaultValue;
                                return acc;
                              }, {} as Record<string, any>)}
                              isSelected={false}
                              isSimulating={false}
                            />
                          </div>
                          <div className="item-rich-meta">
                            <span className="item-title">{item.name}</span>
                            {renderStars(item.difficulty)}
                          </div>
                          <button
                            className="add-quick-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddEquipment(item);
                            }}
                            title="Click to add quickly"
                          >
                            +
                          </button>
                        </div>
                        <p className="item-desc-full">{item.description}</p>
                        {item.supports.length > 0 && (
                          <div className="item-supports-tags">
                            {item.supports.map((s) => (
                              <span key={s} className="support-badge-tag">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="empty-category-text">No matching items</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* RENDER EXPERIMENTS PRESETS TAB */
        <div className="experiments-presets-list">
          {presetExperiments.map((exp) => (
            <div
              key={exp.name}
              className="preset-experiment-card"
              onClick={() => onLoadPreset(exp.name)}
            >
              <div className="preset-card-header">
                <span className="preset-card-icon">{exp.icon}</span>
                <div className="preset-card-title-group">
                  <h4>{exp.name}</h4>
                  <div className="preset-meta-row">
                    {renderStars(exp.stars)}
                    <span className="preset-difficulty-badge">{exp.difficultyLabel}</span>
                    <span className="preset-time-badge">⏱ {exp.time}</span>
                  </div>
                </div>
              </div>

              <p className="preset-card-desc">{exp.description}</p>

              <div className="preset-equipment-section">
                <p className="preset-sub-title">REQUIRED EQUIPMENT</p>
                <div className="preset-equipment-grid">
                  {exp.equipment.map((item) => (
                    <span key={item} className="equipment-check-item">
                      <span className="check-icon">✓</span> {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="preset-card-supports">
                {exp.supports.map((sup) => (
                  <span key={sup} className="preset-sup-pill">
                    {sup}
                  </span>
                ))}
              </div>
              <button
                className="deploy-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadPreset(exp.name);
                }}
              >
                Deploy Apparatus →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VERTICAL SPLITTER DRAG HANDLE */}
      <div className="sidebar-resizer" onPointerDown={handleResizeStart} />
    </aside>
  );
};
