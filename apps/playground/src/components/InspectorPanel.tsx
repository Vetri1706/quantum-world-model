import React from "react";
import type { EquipmentInstance } from "../types/playground";
import { equipmentRegistry } from "../data/equipmentRegistry";

type InspectorProps = {
  selectedInstance: EquipmentInstance | null;
  onUpdateInstance: (id: string, updates: Partial<EquipmentInstance>) => void;
  onDeleteInstance: (id: string) => void;
  onDuplicateInstance: (id: string) => void;
};

export const InspectorPanel: React.FC<InspectorProps> = ({
  selectedInstance,
  onUpdateInstance,
  onDeleteInstance,
  onDuplicateInstance,
}) => {
  if (!selectedInstance) {
    return (
      <aside className="inspector-panel empty-state">
        <div className="inspector-title">Properties</div>
        <p className="eyebrow">NO ELEMENT SELECTED</p>
        <div className="empty-message">
          <span className="empty-icon">✥</span>
          <p>Select an instrument on the workspace or add one from the library to configure its physical properties.</p>
        </div>
      </aside>
    );
  }

  const definition = equipmentRegistry.find((def) => def.id === selectedInstance.definitionId);
  if (!definition) return null;

  const handleParamChange = (paramId: string, value: any) => {
    const nextParams = {
      ...selectedInstance.parameters,
      [paramId]: value,
    };
    onUpdateInstance(selectedInstance.id, { parameters: nextParams });
  };

  return (
    <aside className="inspector-panel">
      <div className="panel-heading">
        <p className="eyebrow">{definition.category.toUpperCase()}</p>
        <h2>{selectedInstance.name}</h2>
        <span className="device-id-tag">ID: {selectedInstance.id}</span>
      </div>

      <div className="inspector-scroll-area">
        {/* SECTION: TRANSFORMS */}
        <details open className="inspector-section">
          <summary>Transform</summary>
          <div className="section-content grid-2-col">
            <label className="prop-control">
              <span>Pos X (nm)</span>
              <input
                type="number"
                value={Math.round(selectedInstance.position.x)}
                onChange={(e) =>
                  onUpdateInstance(selectedInstance.id, {
                    position: { ...selectedInstance.position, x: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label className="prop-control">
              <span>Pos Y (nm)</span>
              <input
                type="number"
                value={Math.round(selectedInstance.position.y)}
                onChange={(e) =>
                  onUpdateInstance(selectedInstance.id, {
                    position: { ...selectedInstance.position, y: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label className="prop-control">
              <span>Width (nm)</span>
              <input
                type="number"
                value={selectedInstance.size.width}
                onChange={(e) =>
                  onUpdateInstance(selectedInstance.id, {
                    size: { ...selectedInstance.size, width: Math.max(10, Number(e.target.value)) },
                  })
                }
              />
            </label>
            <label className="prop-control">
              <span>Height (nm)</span>
              <input
                type="number"
                value={selectedInstance.size.height}
                onChange={(e) =>
                  onUpdateInstance(selectedInstance.id, {
                    size: { ...selectedInstance.size, height: Math.max(10, Number(e.target.value)) },
                  })
                }
              />
            </label>
            <div className="prop-control span-all">
              <div className="slider-label-row">
                <span>Rotation (°)</span>
                <span>{selectedInstance.rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedInstance.rotation}
                onChange={(e) =>
                  onUpdateInstance(selectedInstance.id, { rotation: Number(e.target.value) })
                }
              />
            </div>
            <label className="prop-control span-all">
              <span>Device Tag</span>
              <input
                type="text"
                value={selectedInstance.name}
                onChange={(e) => onUpdateInstance(selectedInstance.id, { name: e.target.value })}
              />
            </label>
          </div>
        </details>

        {/* SECTION: PHYSICAL PROPERTIES */}
        {definition.inspector.length > 0 && (
          <details open className="inspector-section">
            <summary>Physical Parameters</summary>
            <div className="section-content">
              {definition.inspector.map((field) => {
                const value =
                  selectedInstance.parameters[field.id] !== undefined
                    ? selectedInstance.parameters[field.id]
                    : field.defaultValue;

                return (
                  <div key={field.id} className="prop-control border-bottom">
                    {field.type === "number" && (
                      <>
                        <div className="slider-label-row">
                          <span>{field.label}</span>
                          <b>
                            {value} {field.unit || ""}
                          </b>
                        </div>
                        {field.minimum !== undefined && field.maximum !== undefined ? (
                          <input
                            type="range"
                            min={field.minimum}
                            max={field.maximum}
                            step={field.step || 1}
                            value={value}
                            onChange={(e) => handleParamChange(field.id, Number(e.target.value))}
                          />
                        ) : (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => handleParamChange(field.id, Number(e.target.value))}
                          />
                        )}
                      </>
                    )}

                    {field.type === "boolean" && (
                      <label className="checkbox-row">
                        <span>{field.label}</span>
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => handleParamChange(field.id, e.target.checked)}
                        />
                      </label>
                    )}

                    {field.type === "select" && (
                      <label className="select-row">
                        <span>{field.label}</span>
                        <select
                          value={value}
                          onChange={(e) => handleParamChange(field.id, e.target.value)}
                        >
                          {field.allowedValues?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {field.type === "string" && (
                      <label className="text-row">
                        <span>{field.label}</span>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleParamChange(field.id, e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* SECTION: PORTS INFO */}
        {definition.ports.length > 0 && (
          <details className="inspector-section">
            <summary>I/O Terminals</summary>
            <div className="section-content">
              <ul className="port-details-list">
                {definition.ports.map((port) => (
                  <li key={port.id} className="port-item-info">
                    <span className={`port-badge ${port.type}`}>
                      {port.type.toUpperCase()}
                    </span>
                    <span className="port-label">{port.label}</span>
                    <span className="port-kind">({port.kind})</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {/* SECTION: SCIENTIFIC DETAILS & HOOKS */}
        <details className="inspector-section">
          <summary>Simulation Bindings</summary>
          <div className="section-content code-style">
            <div>
              <span>Solver Hook:</span>
              <code>{definition.simulationHook}()</code>
            </div>
            <div>
              <span>Shader Hook:</span>
              <code>{definition.rendererHook}()</code>
            </div>
            <div>
              <span>Rules:</span>
              <code>
                {definition.placementRules.length > 0
                  ? definition.placementRules.join(", ")
                  : "unconstrained"}
              </code>
            </div>
          </div>
        </details>
      </div>

      {/* QUICK ACTIONS FOOTER */}
      <div className="inspector-actions-footer">
        <button className="btn-secondary" onClick={() => onDuplicateInstance(selectedInstance.id)}>
          ❐ Duplicate
        </button>
        <button className="btn-danger" onClick={() => onDeleteInstance(selectedInstance.id)}>
          🗑 Delete
        </button>
      </div>
    </aside>
  );
};
