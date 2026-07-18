import React from "react";

type SVGProps = {
  svgId: string;
  width: number;
  height: number;
  parameters: Record<string, any>;
  isSelected?: boolean;
  isSimulating?: boolean;
};

export const EquipmentSVG: React.FC<SVGProps> = ({
  svgId,
  parameters = {},
  isSelected = false,
  isSimulating = false,
}) => {
  const strokeColor = isSelected ? "#00ffcc" : "#6272aa";
  const glowFilter = isSelected ? "url(#neon-glow)" : undefined;

  // Render wavelength colors dynamically for laser/photon sources
  const getWavelengthColor = (wl: number) => {
    if (!wl) return "#00ffcc";
    if (wl >= 380 && wl < 450) return "#8b00ff"; // Violet
    if (wl >= 450 && wl < 495) return "#0000ff"; // Blue
    if (wl >= 495 && wl < 570) return "#00ff00"; // Green
    if (wl >= 570 && wl < 590) return "#ffff00"; // Yellow
    if (wl >= 590 && wl < 620) return "#ff7f00"; // Orange
    if (wl >= 620 && wl <= 780) return "#ff0000"; // Red
    return "#00ffcc";
  };

  const wlColor = getWavelengthColor(parameters.wavelength || parameters.targetWavelength || 532);

  // SVG components for each device
  switch (svgId) {
    // ================= QUANTUM SOURCES =================
    case "electron-gun":
      return (
        <svg width="100%" height="100%" viewBox="0 0 90 50" preserveAspectRatio="none">
          <defs>
            <linearGradient id="egun-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          {/* Main Gun Body */}
          <rect x="5" y="10" width="60" height="30" rx="4" fill="url(#egun-grad)" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* Back connector */}
          <rect x="1" y="20" width="4" height="10" rx="1" fill="#334155" />
          {/* Front barrel nozzle */}
          <path d="M 65 17 L 85 17 L 85 33 L 65 33 Z" fill="#64748b" stroke={strokeColor} strokeWidth="2" />
          {/* Filament coils inside */}
          <path d="M 15 25 Q 20 20 25 25 T 35 25 T 45 25" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray={isSimulating ? "2 1" : undefined} />
          {/* Glowing particle emitter tip */}
          {isSimulating ? (
            <circle cx="82" cy="25" r="4" fill="#00ffcc" className="pulse-slow" />
          ) : (
            <g className="idle-ambient-particles">
              <circle cx="82" cy="25" r="2" fill="#00ffcc" className="idle-particle-1" opacity="0.6" />
              <circle cx="82" cy="25" r="1.5" fill="#3b82f6" className="idle-particle-2" opacity="0.4" />
            </g>
          )}
        </svg>
      );

    case "photon-source":
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 50" preserveAspectRatio="none">
          <rect x="5" y="5" width="55" height="40" rx="8" fill="#1e1b4b" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* Laser diode pump crystal */}
          <rect x="60" y="15" width="15" height="20" rx="2" fill="#4f46e5" stroke={strokeColor} strokeWidth="1" />
          <circle cx="32" cy="25" r="8" fill="none" stroke={wlColor} strokeWidth="2" className="idle-glow-pulse" />
          <circle cx="32" cy="25" r="3" fill={wlColor} />
          {/* Small spark ticks */}
          <line x1="32" y1="10" x2="32" y2="14" stroke={wlColor} strokeWidth="1.5" />
          <line x1="32" y1="36" x2="32" y2="40" stroke={wlColor} strokeWidth="1.5" />
          <line x1="17" y1="25" x2="21" y2="25" stroke={wlColor} strokeWidth="1.5" />
          <line x1="43" y1="25" x2="47" y2="25" stroke={wlColor} strokeWidth="1.5" />
        </svg>
      );

    case "wavepacket-generator":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
          {/* Scope bezel */}
          <rect x="2" y="2" width="96" height="56" rx="6" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" filter={glowFilter} />
          {/* Screen area */}
          <rect x="8" y="8" width="60" height="44" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
          {/* Wave packet curve display */}
          <path
            d="M 12 30 Q 20 30 25 22 T 32 10 T 39 45 T 46 25 T 52 32 T 64 30"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            className={isSimulating ? "pulse-fast" : "idle-glow-pulse"}
          />
          {/* Parameter knobs */}
          <circle cx="82" cy="18" r="5" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          <circle cx="82" cy="38" r="5" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          <line x1="82" y1="18" x2="85" y2="15" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="82" y1="38" x2="80" y2="42" stroke="#94a3b8" strokeWidth="1.5" />
        </svg>
      );

    // ================= QUANTUM OBJECTS =================
    case "potential-barrier":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="barrier-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#451a03" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.9" className="idle-shimmer" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Translucent Energy Slab */}
          <rect x="10" y="5" width="40" height="90" rx="4" fill="url(#barrier-grad)" stroke="#ea580c" strokeWidth={isSelected ? "3" : "1.5"} />
          {/* Potential energy levels (horizontal stripes) */}
          <line x1="10" y1="25" x2="50" y2="25" stroke="#fdba74" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="10" y1="50" x2="50" y2="50" stroke="#fdba74" strokeWidth="1.5" />
          <line x1="10" y1="75" x2="50" y2="75" stroke="#fdba74" strokeWidth="1" strokeDasharray="3 3" />
          {/* Voltage label tag */}
          <text x="30" y="53" fill="#ffedd5" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 30 50)">
            {parameters.height || 6} eV
          </text>
        </svg>
      );

    case "potential-well":
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="well-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Dashed outer box boundary */}
          <rect x="5" y="5" width="70" height="90" rx="4" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Deep well well block */}
          <rect x="15" y="30" width="50" height="65" rx="2" fill="url(#well-grad)" stroke="#3b82f6" strokeWidth="2.5" />
          {/* Eigenstates energy levels inside */}
          <line x1="15" y1="45" x2="65" y2="45" stroke="#93c5fd" strokeWidth="1" />
          <line x1="15" y1="65" x2="65" y2="65" stroke="#93c5fd" strokeWidth="1" />
          <line x1="15" y1="85" x2="65" y2="85" stroke="#93c5fd" strokeWidth="1" />
          <text x="40" y="60" fill="#eff6ff" fontSize="9" fontWeight="bold" textAnchor="middle">
            {parameters.depth || -5} eV
          </text>
        </svg>
      );

    case "infinite-wall":
      return (
        <svg width="100%" height="100%" viewBox="0 0 40 120" preserveAspectRatio="none">
          {/* Massive Wall Core */}
          <rect x="5" y="5" width="30" height="110" fill="#334155" stroke="#f1f5f9" strokeWidth="2" />
          {/* Warning diagonal hazard stripes */}
          <g stroke="#e2e8f0" strokeWidth="3">
            <line x1="5" y1="20" x2="35" y2="40" />
            <line x1="5" y1="50" x2="35" y2="70" />
            <line x1="5" y1="80" x2="35" y2="100" />
          </g>
          <text x="20" y="60" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle" transform="rotate(-90 20 60)">
            ∞ IMPENETRABLE
          </text>
        </svg>
      );

    case "single-slit":
      return (
        <svg width="100%" height="100%" viewBox="0 0 30 120" preserveAspectRatio="none">
          {/* Top Plate */}
          <rect x="5" y="5" width="20" height="45" fill="#475569" stroke={strokeColor} strokeWidth="1.5" />
          {/* Bottom Plate */}
          <rect x="5" y="70" width="20" height="45" fill="#475569" stroke={strokeColor} strokeWidth="1.5" />
          {/* Slit gap width lines */}
          <line x1="25" y1="50" x2="25" y2="70" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 2" />
          <text x="15" y="62" fill="#fda4af" fontSize="9" textAnchor="middle">
            {parameters.slitWidth || 0.5}nm
          </text>
        </svg>
      );

    case "double-slit":
      return (
        <svg width="100%" height="100%" viewBox="0 0 30 120" preserveAspectRatio="none">
          {/* Top Plate */}
          <rect x="5" y="5" width="20" height="35" fill="#475569" stroke={strokeColor} strokeWidth="1.5" />
          {/* Middle blocker */}
          <rect x="5" y="50" width="20" height="20" fill="#475569" stroke={strokeColor} strokeWidth="1.5" />
          {/* Bottom Plate */}
          <rect x="5" y="80" width="20" height="35" fill="#475569" stroke={strokeColor} strokeWidth="1.5" />
          {/* Double slit markers */}
          <circle cx="15" cy="42" r="2.5" fill="#f43f5e" />
          <circle cx="15" cy="75" r="2.5" fill="#f43f5e" />
        </svg>
      );

    // ================= OPTICAL COMPONENTS =================
    case "laser":
      return (
        <svg width="100%" height="100%" viewBox="0 0 90 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="laser-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          {/* Laser Head Assembly */}
          <rect x="10" y="8" width="55" height="24" rx="2" fill="url(#laser-grad)" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* Cooling Fin rings */}
          <rect x="15" y="5" width="5" height="30" fill="#475569" />
          <rect x="25" y="5" width="5" height="30" fill="#475569" />
          <rect x="35" y="5" width="5" height="30" fill="#475569" />
          {/* Brass nozzle splitter */}
          <path d="M 65 12 L 80 12 L 80 28 L 65 28 Z" fill="#d97706" stroke={strokeColor} strokeWidth="1" />
          {/* Aperture ring */}
          <circle cx="80" cy="20" r="5" fill="#1e293b" stroke={wlColor} strokeWidth="1.5" className="laser-lens-pulsing" />
          {/* Emitted laser ray snippet */}
          {isSimulating && (
            <line x1="82" y1="20" x2="90" y2="20" stroke={wlColor} strokeWidth="3" filter="url(#neon-glow)" />
          )}
        </svg>
      );

    case "mirror":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60">
          {/* Base mounting post */}
          <circle cx="30" cy="30" r="14" fill="#1e293b" stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="30" cy="30" r="4" fill="#64748b" />
          {/* Mirror surface (angled strip) */}
          <g transform={`rotate(${parameters.angle || 45} 30 30)`}>
            {/* Mirror support block */}
            <rect x="10" y="27" width="40" height="6" rx="1" fill="#475569" stroke={strokeColor} strokeWidth="1" />
            {/* Mirror silver layer */}
            <rect x="10" y="24" width="40" height="3" rx="0.5" fill="#e2e8f0" stroke="#00f3ff" strokeWidth="1" />
          </g>
        </svg>
      );

    case "beam-splitter":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60">
          {/* Mounting base */}
          <rect x="12" y="12" width="36" height="36" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth="1.5" />
          {/* Splitter Cube Body */}
          <rect x="16" y="16" width="28" height="28" fill="#3b82f6" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="2.5" />
          {/* Diagonal splitting mirror surface */}
          <line x1="16" y1="44" x2="44" y2="16" stroke="#93c5fd" strokeWidth="3" strokeDasharray="1 1" />
          {/* Splitting arrows */}
          <path d="M 28 32 L 35 32 M 35 32 L 32 29 M 35 32 L 32 35" stroke="#60a5fa" strokeWidth="1.5" fill="none" />
          <path d="M 32 28 L 32 21 M 32 21 L 29 24 M 32 21 L 35 24" stroke="#60a5fa" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case "lens":
      return (
        <svg width="100%" height="100%" viewBox="0 0 40 70">
          {/* Metal ring holder */}
          <rect x="17" y="5" width="6" height="60" rx="3" fill="#475569" stroke={strokeColor} strokeWidth="1" />
          {/* Glass Convex Lens shape */}
          <path d="M 20 8 A 20 40 0 0 0 20 62 A 20 40 0 0 0 20 8" fill="#38bdf8" fillOpacity="0.5" stroke="#0ea5e9" strokeWidth="2" />
        </svg>
      );

    case "polarizer":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60">
          {/* Outer ring */}
          <circle cx="30" cy="30" r="24" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          {/* Internal rotating grid lines representing polarization polarization axis */}
          <g transform={`rotate(${parameters.angle || 0} 30 30)`}>
            <circle cx="30" cy="30" r="19" fill="#1e293b" fillOpacity="0.3" stroke="#475569" strokeWidth="1" />
            <line x1="30" y1="11" x2="30" y2="49" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="22" y1="14" x2="22" y2="46" stroke="#475569" strokeWidth="1" />
            <line x1="38" y1="14" x2="38" y2="46" stroke="#475569" strokeWidth="1" />
            <line x1="15" y1="21" x2="15" y2="39" stroke="#475569" strokeWidth="1" />
            <line x1="45" y1="21" x2="45" y2="39" stroke="#475569" strokeWidth="1" />
          </g>
          {/* Axis label */}
          <text x="30" y="52" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
            {parameters.angle || 0}°
          </text>
        </svg>
      );

    case "phase-plate":
      return (
        <svg width="100%" height="100%" viewBox="0 0 50 60">
          <rect x="5" y="8" width="40" height="44" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          {/* Birefringent crystal plate */}
          <rect x="12" y="14" width="26" height="32" fill="#ec4899" fillOpacity="0.2" stroke="#ec4899" strokeWidth="2" />
          {/* Phase Symbol Δφ */}
          <text x="25" y="36" fill="#f472b6" fontSize="12" fontWeight="bold" textAnchor="middle">
            Δφ
          </text>
        </svg>
      );

    // ================= MEASUREMENT =================
    case "detector":
      return (
        <svg width="100%" height="100%" viewBox="0 0 70 60" preserveAspectRatio="none">
          <rect x="5" y="8" width="50" height="44" rx="6" fill="#111827" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* Silicon photodiode lens */}
          <path d="M 55 18 L 65 18 L 65 42 L 55 42 Z" fill="#10b981" stroke={strokeColor} strokeWidth="1" />
          <circle cx="65" cy="30" r="3" fill="#059669" />
          {/* Sensor light bulb */}
          <circle cx="30" cy="30" r="8" fill="#1e293b" stroke="#374151" strokeWidth="1.5" />
          {isSimulating && (
            <circle cx="30" cy="30" r="5" fill="#10b981" className="pulse-fast" />
          )}
          {/* Digital pulse indicators */}
          <rect x="10" y="16" width="12" height="6" fill="#374151" />
          <circle cx="16" cy="19" r="2" fill={isSimulating ? "#ef4444" : "#10b981"} />
        </svg>
      );

    case "projection-screen":
      return (
        <svg width="100%" height="100%" viewBox="0 0 40 160" preserveAspectRatio="none">
          {/* Monitor frame */}
          <rect x="5" y="5" width="30" height="150" rx="3" fill="#1e293b" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* Fluorescent screen */}
          <rect x="10" y="10" width="20" height="140" fill="#022c22" stroke="#047857" strokeWidth="1" />
          {/* Interference peak curve simulation */}
          {isSimulating ? (
            <path
              d="M 20 15 C 20 25 15 35 15 45 C 15 55 25 65 25 80 C 25 95 15 105 15 115 C 15 125 20 135 20 145"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <line x1="20" y1="10" x2="20" y2="150" stroke="#065f46" strokeWidth="1" strokeDasharray="3 3" />
          )}
        </svg>
      );

    case "beam-stop":
      return (
        <svg width="100%" height="100%" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="#111827" stroke={strokeColor} strokeWidth="2.5" />
          {/* Corrugated absorption vanes */}
          <circle cx="25" cy="25" r="14" fill="#374151" />
          <circle cx="25" cy="25" r="8" fill="#030712" />
          {/* Absorb icon */}
          <path d="M 21 21 L 29 29 M 29 21 L 21 29" stroke="#9ca3af" strokeWidth="2" />
        </svg>
      );

    case "counter":
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 50" preserveAspectRatio="none">
          <rect x="4" y="4" width="72" height="42" rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth="2" filter={glowFilter} />
          {/* LED Display Screen */}
          <rect x="10" y="10" width="60" height="22" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          {/* Glowing Red LED count text */}
          <text x="40" y="26" fill="#ef4444" fontFamily="monospace" fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            {isSimulating ? "1,048" : "0,000"}
          </text>
          <text x="40" y="42" fill="#64748b" fontSize="6" textAnchor="middle">
            PULSES / SEC
          </text>
        </svg>
      );

    // ================= ENVIRONMENT =================
    case "vacuum-chamber":
      return (
        <svg width="100%" height="100%" viewBox="0 0 180 120" preserveAspectRatio="none">
          {/* Chamber Glass Dome */}
          <rect x="5" y="5" width="170" height="110" rx="18" fill="#0ea5e9" fillOpacity="0.05" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 5" />
          {/* Metal base plate */}
          <rect x="15" y="105" width="150" height="10" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          {/* Pressure Dial Gauge */}
          <circle cx="90" cy="100" r="10" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <line x1="90" y1="100" x2="94" y2="94" stroke="#ef4444" strokeWidth="1.5" />
          <text x="125" y="98" fill="#38bdf8" fontSize="8" fontWeight="bold">
            {parameters.pressure || "1e-6"} Torr
          </text>
        </svg>
      );

    case "optical-bench":
      return (
        <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
          {/* Table Honeycomb Plate */}
          <rect x="2" y="2" width="196" height="76" fill="#334155" fillOpacity="0.3" stroke="#475569" strokeWidth="2" />
          {/* Array of screw mount holes */}
          <g fill="#475569">
            <circle cx="20" cy="20" r="2.5" />
            <circle cx="60" cy="20" r="2.5" />
            <circle cx="100" cy="20" r="2.5" />
            <circle cx="140" cy="20" r="2.5" />
            <circle cx="180" cy="20" r="2.5" />
            <circle cx="20" cy="40" r="2.5" />
            <circle cx="60" cy="40" r="2.5" />
            <circle cx="100" cy="40" r="2.5" />
            <circle cx="140" cy="40" r="2.5" />
            <circle cx="180" cy="40" r="2.5" />
            <circle cx="20" cy="60" r="2.5" />
            <circle cx="60" cy="60" r="2.5" />
            <circle cx="100" cy="60" r="2.5" />
            <circle cx="140" cy="60" r="2.5" />
            <circle cx="180" cy="60" r="2.5" />
          </g>
        </svg>
      );

    // ================= FIELDS =================
    case "electric-field":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
          {/* Anode plate */}
          <rect x="10" y="5" width="80" height="8" rx="1" fill="#ea580c" />
          <text x="94" y="12" fill="#ea580c" fontSize="9" fontWeight="bold">+</text>
          {/* Cathode plate */}
          <rect x="10" y="47" width="80" height="8" rx="1" fill="#2563eb" />
          <text x="94" y="54" fill="#2563eb" fontSize="9" fontWeight="bold">-</text>
          {/* Field Lines */}
          <g stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6">
            <line x1="25" y1="13" x2="25" y2="47" />
            <line x1="50" y1="13" x2="50" y2="47" />
            <line x1="75" y1="13" x2="75" y2="47" />
          </g>
          {/* Deflection arrows */}
          <path d="M 50 18 L 50 42 M 50 42 L 47 38 M 50 42 L 53 38" stroke="#10b981" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case "magnetic-field":
      return (
        <svg width="100%" height="100%" viewBox="0 0 110 70" preserveAspectRatio="none">
          {/* Coil loops */}
          <rect x="10" y="10" width="90" height="50" rx="8" fill="none" stroke="#15803d" strokeWidth="3" />
          <g stroke="#22c55e" strokeWidth="1.5">
            <line x1="20" y1="10" x2="20" y2="60" />
            <line x1="35" y1="10" x2="35" y2="60" />
            <line x1="50" y1="10" x2="50" y2="60" />
            <line x1="65" y1="10" x2="65" y2="60" />
            <line x1="80" y1="10" x2="80" y2="60" />
          </g>
          {/* Magnetic flux B vector circles */}
          <circle cx="50" cy="35" r="10" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="50" cy="35" r="2" fill="#22c55e" />
          <text x="65" y="39" fill="#22c55e" fontSize="9" fontWeight="bold">B-field</text>
        </svg>
      );

    // ================= VISUALIZATION =================
    case "probability-plot":
      return (
        <svg width="100%" height="100%" viewBox="0 0 160 100" preserveAspectRatio="none">
          {/* Screen background */}
          <rect x="5" y="5" width="150" height="90" rx="6" fill="#020617" stroke={strokeColor} strokeWidth="2.5" />
          {/* Grid lines */}
          <line x1="5" y1="50" x2="155" y2="50" stroke="#1e293b" strokeWidth="1" />
          <line x1="80" y1="5" x2="80" y2="95" stroke="#1e293b" strokeWidth="1" />
          {/* Dynamic wave distribution drawing */}
          {isSimulating ? (
            <path
              d="M 10 50 C 30 50, 40 10, 50 10 C 60 10, 65 90, 75 90 C 85 90, 95 30, 110 30 C 125 30, 140 50, 150 50"
              fill="none"
              stroke="#00ffcc"
              strokeWidth="2.5"
              className="probability-wave"
              filter="url(#neon-glow)"
            />
          ) : (
            <path
              d="M 10 50 Q 80 15 150 50"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}
          <text x="14" y="20" fill="#475569" fontSize="8" fontFamily="monospace">|Ψ(x)|²</text>
        </svg>
      );

    case "state-viewer":
      return (
        <svg width="100%" height="100%" viewBox="0 0 150 100" preserveAspectRatio="none">
          <rect x="5" y="5" width="140" height="90" rx="6" fill="#020617" stroke={strokeColor} strokeWidth="2" />
          {/* State basis phasor bars */}
          <line x1="30" y1="80" x2="30" y2="20" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <line x1="75" y1="80" x2="75" y2="35" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <line x1="120" y1="80" x2="120" y2="50" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

          {/* Active coefficients filled */}
          {isSimulating && (
            <>
              <line x1="30" y1="80" x2="30" y2="28" stroke="#d946ef" strokeWidth="6" strokeLinecap="round" />
              <line x1="75" y1="80" x2="75" y2="48" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
              <line x1="120" y1="80" x2="120" y2="62" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            </>
          )}

          <text x="30" y="92" fill="#94a3b8" fontSize="8" textAnchor="middle">|ψ₁⟩</text>
          <text x="75" y="92" fill="#94a3b8" fontSize="8" textAnchor="middle">|ψ₂⟩</text>
          <text x="120" y="92" fill="#94a3b8" fontSize="8" textAnchor="middle">|ψ₃⟩</text>
        </svg>
      );

    case "bloch-sphere":
      return (
        <svg width="100%" height="100%" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="1" />
          {/* Equatorial Ellipse */}
          <ellipse cx="60" cy="60" rx="50" ry="16" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Vertical axis line */}
          <line x1="60" y1="5" x2="60" y2="115" stroke="#334155" strokeWidth="1.5" />
          <text x="60" y="12" fill="#ef4444" fontSize="8" textAnchor="middle" fontWeight="bold">|0⟩</text>
          <text x="60" y="118" fill="#3b82f6" fontSize="8" textAnchor="middle" fontWeight="bold">|1⟩</text>

          {/* State Vector Arrow */}
          <g className={isSimulating ? "precessing-vector" : undefined}>
            <line
              x1="60"
              y1="60"
              x2={isSimulating ? "95" : "78"}
              y2={isSimulating ? "35" : "32"}
              stroke="#ff007f"
              strokeWidth="3.5"
              markerEnd="url(#arrow-head)"
            />
          </g>
          <circle cx="60" cy="60" r="3" fill="#e2e8f0" />
        </svg>
      );

    // ================= ANALYSIS =================
    case "histogram":
      return (
        <svg width="100%" height="100%" viewBox="0 0 160 100" preserveAspectRatio="none">
          <rect x="5" y="5" width="150" height="90" rx="6" fill="#020617" stroke={strokeColor} strokeWidth="2.5" />
          {/* Bars */}
          <rect x="15" y="60" width="12" height="30" fill="#3b82f6" opacity="0.6" />
          <rect x="32" y="45" width="12" height="45" fill="#3b82f6" opacity="0.7" />
          <rect x="49" y="30" width="12" height="60" fill="#3b82f6" opacity="0.85" />
          <rect x="66" y="15" width="12" height="75" fill="#3b82f6" />
          <rect x="83" y="35" width="12" height="55" fill="#3b82f6" opacity="0.85" />
          <rect x="100" y="50" width="12" height="40" fill="#3b82f6" opacity="0.7" />
          <rect x="117" y="65" width="12" height="25" fill="#3b82f6" opacity="0.6" />
          <rect x="134" y="75" width="12" height="15" fill="#3b82f6" opacity="0.5" />
          <text x="80" y="93" fill="#64748b" fontSize="7" textAnchor="middle">DELAY TIME (τ)</text>
        </svg>
      );

    // ================= UTILITIES =================
    case "bnc-t":
      return (
        <svg width="100%" height="100%" viewBox="0 0 50 40">
          <rect x="10" y="14" width="20" height="12" rx="1" fill="#475569" stroke={strokeColor} strokeWidth="1" />
          <rect x="30" y="6" width="12" height="28" rx="1" fill="#334155" stroke={strokeColor} strokeWidth="1" />
          {/* Core metallic inputs */}
          <circle cx="10" cy="20" r="3" fill="#94a3b8" />
          <circle cx="42" cy="11" r="3" fill="#94a3b8" />
          <circle cx="42" cy="29" r="3" fill="#94a3b8" />
        </svg>
      );

    default:
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60">
          <rect x="5" y="5" width="50" height="50" rx="6" fill="#1e293b" stroke={strokeColor} strokeWidth="2" strokeDasharray="3 3" />
          <text x="30" y="35" fill="#94a3b8" fontSize="20" textAnchor="middle">?</text>
        </svg>
      );
  }
};
