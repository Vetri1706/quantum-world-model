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
  const strokeColor = isSelected ? "#5682C4" : "rgba(232, 232, 232, 0.35)";
  const glowEffect = isSelected ? "drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))" : undefined;

  // Enhanced wavelength color system
  const getWavelengthColor = (wl: number) => {
    if (!wl) return "#5682C4";
    if (wl >= 380 && wl < 450) return "#A855F7"; // Violet
    if (wl >= 450 && wl < 495) return "#3B82F6"; // Blue
    if (wl >= 495 && wl < 570) return "#10B981"; // Green
    if (wl >= 570 && wl < 590) return "#FBBF24"; // Yellow
    if (wl >= 590 && wl < 620) return "#FB923C"; // Orange
    if (wl >= 620 && wl <= 780) return "#EF4444"; // Red
    return "#5682C4";
  };

  const wlColor = getWavelengthColor(parameters.wavelength || parameters.targetWavelength || 532);

  switch (svgId) {
    // ==================== QUANTUM SOURCES ====================
    
    case "electron-gun":
      return (
        <svg width="100%" height="100%" viewBox="0 0 90 50" style={{ filter: glowEffect }}>
          {/* High-vacuum electron gun tube */}
          <rect x="8" y="12" width="74" height="26" rx="3" fill="#1A1A2E" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Heating filament at base */}
          <ellipse cx="45" cy="19" rx="18" ry="3" fill="#CC3333" opacity="0.6" />
          
          {/* Electron beam focusing columns */}
          <path d="M 20 25 Q 30 20 40 25 T 50 25 T 60 25" fill="none" stroke="#5682C4" strokeWidth="1.5" strokeDasharray={isSimulating ? "3 2" : undefined} />
          
          {/* Cathode and anode structure */}
          <circle cx="25" cy="25" r="3" fill="#CCCCCC" />
          <line x1="28" y1="25" x2="65" y2="25" stroke="#95A5A6" strokeWidth="1" strokeDasharray="4 2" />
          
          {/* Beam path visualization */}
          <line x1="75" y1="25" x2="85" y2="25" stroke={wlColor} strokeWidth="1.5" opacity="0.7" />
          
          {/* Electron spots in beam */}
          <circle cx="78" cy="25" r="1.5" fill={wlColor}>
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
          
          {/* Voltage markers */}
          <text x="10" y="8" fill="#7F8C8D" fontSize="6" fontWeight="400">HEATER: 12kV</text>
        </svg>
      );

    case "photon-source":
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 50" style={{ filter: glowEffect }}>
          {/* Laser diode chip */}
          <rect x="10" y="14" width="48" height="24" rx="3" fill="#2D2D2D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Optical lens assembly */}
          <rect x="60" y="18" width="14" height="14" rx="2" fill="#1D1D1D" stroke={wlColor} strokeWidth="1.5" />
          
          {/* Laser emission crystal */}
          <circle cx="36" cy="26" r="4" fill="none" stroke={wlColor} strokeWidth="1.5" />
          <circle cx="36" cy="26" r="1.5" fill={wlColor} opacity="0.9" />
          
          {/* Beam output laser */}
          <line x1="66" y1="25" x2="78" y2="25" stroke={wlColor} strokeWidth="1.5" />
          <polygon points="78,23 83,25 78,27" fill={wlColor} />
          
          {/* Wave pattern indicating wavelength */}
          <path d="M 22 20 Q 24 18 26 20 T 28 18 T 30 20" fill="none" stroke={wlColor} strokeWidth="0.5" opacity="0.6" />
          <path d="M 32 21 Q 34 19 36 21 T 38 19 T 40 21" fill="none" stroke={wlColor} strokeWidth="0.5" opacity="0.6" />
          
          {/* Port markers */}
          <circle cx="38" cy="26" r="1" fill="#7F8C8D" opacity="0.5" />
        </svg>
      );

    case "laser":
      return (
        <svg width="100%" height="100%" viewBox="0 0 90 45" style={{ filter: glowEffect }}>
          {/* Laser body */}
          <rect x="8" y="14" width="74" height="17" rx="3" fill="#2D2D2D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Laser crystal cavity */}
          <rect x="24" y="17" width="42" height="11" fill="#1A1A2E" stroke={wlColor} strokeWidth="0.5" />
          
          {/* Output coupler */}
          <line x1="66" y1="22.5" x2="84" y2="22.5" stroke={wlColor} strokeWidth="1.5" />
          <polygon points="86,21 90,22.5 86,24" fill={wlColor} />
          
          {/* Beam divergence effect */}
          <line x1="66" y1="17" x2="62" y2="22.5" stroke={wlColor} strokeWidth="0.8" opacity="0.5" />
          <line x1="66" y1="28" x2="70" y2="22.5" stroke={wlColor} strokeWidth="0.8" opacity="0.5" />
          
          {/* Wavelength indicator */}
          <text x="10" y="28" fill={wlColor} fontSize="7" fontWeight="600">
            {parameters.wavelength ? `${parameters.wavelength} nm` : "632.8nm"}
          </text>
          
          {/* Laser status dot */}
          <circle cx="80" cy="20" r="2" fill={wlColor} opacity={isSimulating ? "1" : "0.3"}>
            <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      );

    // ==================== OPTICAL COMPONENTS ====================
    
    case "potential-barrier":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 80" style={{ filter: glowEffect }}>
          {/* Translucent potential barrier */}
          <rect x="15" y="8" width="30" height="64" rx="3" fill="rgba(180, 150, 50, 0.15)" stroke="#C08B35" strokeWidth="1.5" />
          
          {/* Barrier structure lines */}
          <line x1="15" y1="24" x2="45" y2="24" stroke="#B57A31" strokeWidth="0.8" opacity="0.6" />
          <line x1="15" y1="40" x2="45" y2="40" stroke="#B57A31" strokeWidth="0.8" opacity="0.6" />
          <line x1="15" y1="56" x2="45" y2="56" stroke="#B57A31" strokeWidth="0.8" opacity="0.6" />
          
          {/* Edge highlights */}
          <path d="M 15 8 L 45 8 L 45 72 L 15 72 Z" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
          
          {/* Quantum tunneling indicator */}
          <text x="25" y="36" fill="#E0B84C" fontSize="6" opacity="0.8">###</text>
        </svg>
      );

    case "double-slit":
      return (
        <svg width="100%" height="100%" viewBox="0 0 50 80" style={{ filter: glowEffect }}>
          {/* Top wall */}
          <rect x="18" y="6" width="14" height="24" rx="2" fill="#2D2D2D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Middle wall segment */}
          <rect x="18" y="36" width="14" height="8" rx="1" fill="#2D2D2D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Bottom wall */}
          <rect x="18" y="50" width="14" height="24" rx="2" fill="#2D2D2D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Slit openings with wave patterns */}
          <path d="M 25 30 Q 27 28 29 30 T 31 28 T 33 30" fill="none" stroke={wlColor} strokeWidth="1.5" opacity="0.8" />
          
          <path d="M 25 44 Q 27 42 29 44 T 31 42 T 33 44" fill="none" stroke={wlColor} strokeWidth="1.5" opacity="0.8" />
          
          {/* Wave interference pattern */}
          <g opacity="0.5">
            <line x1="22" y1="32" x2="28" y2="35" stroke={wlColor} strokeWidth="0.5" />
            <line x1="25" y1="36" x2="31" y2="33" stroke={wlColor} strokeWidth="0.5" />
            <line x1="32" y1="38" x2="28" y2="41" stroke={wlColor} strokeWidth="0.5" />
          </g>
          
          {/* Slit width indicators */}
          <text x="28" y="20" fill="#7F8C8D" fontSize="5">0.4µm</text>
          <text x="28" y="52" fill="#7F8C8D" fontSize="5">0.4µm</text>
          <text x="28" y="40" fill="#2DD4BF" fontSize="5" stroke="#2DD4BF" strokeWidth="0.5">2.2µm</text>
        </svg>
      );

    case "polarizer":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          {/* Circular polarizer frame */}
          <circle cx="30" cy="30" r="24" fill="rgba(29, 29,29, 0.7)" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Polarizing filter lenses */}
          <circle cx="30" cy="30" r="20" fill="rgba(86, 130, 196, 0.15)" />
          
          {/* Polar axis indicator */}
          <line x1="30" y1="14" x2="30" y2="46" stroke="#5682C4" strokeWidth="1.8" />
          <line x1="23" y1="20" x2="23" y2="40" stroke="#5682C4" strokeWidth="1" opacity="0.5" />
          <line x1="37" y1="20" x2="37" y2="40" stroke="#5682C4" strokeWidth="1" opacity="0.5" />
          
          {/* Angle indicator */}
          <circle cx="30" cy="14" r="3" fill="#FBBF24" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" values="0 30 14;45 30 14;-30 30 14;0 30 14" dur="4s" repeatCount="indefinite" />
          </circle>
          
          {/* Polarization effect arrows */}
          <path d="M 22 14 Q 25 12 28 14 T 31 12 T 34 14" fill="none" stroke="#FBBF24" strokeWidth="1.2" opacity="0.7" />
          
          <text x="30" y="52" fill="#E8E8E8" fontSize="5" textAnchor="middle" opacity="0.7">45°</text>
        </svg>
      );

    case "beam-splitter":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          {/* Periscope prism/cube */}
          <rect x="10" y="10" width="40" height="40" rx="3" fill="rgba(232, 232, 232, 0.03)" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Beam splitter interface */}
          <line x1="10" y1="50" x2="50" y2="10" stroke="#5682C4" strokeWidth="2.5" strokeDasharray="6 4" />
          
          {/* Reference marks for 50/50 split */}
          <line x1="16" y1="48" x2="48" y2="16" stroke="#C0C0C0" strokeWidth="0.8" opacity="0.6" />
          
          {/* Ray path indicators */}
          <circle cx="14" cy="14" r="1.5" fill="#48CF53" opacity="0.8">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="46" cy="46" r="1.5" fill="#48CF53" opacity="0.8">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          
          {/* Splitter quality indicator */}
          <text x="30" y="54" fill="#48CF53" fontSize="5" fontWeight="600" textAnchor="middle">99.7%</text>
        </svg>
      );

    case "mirror":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          {/* Mirror surface (60% reflectivity simulation) */}
          <rect x="12" y="12" width="36" height="36" rx="3" fill="rgba(25, 25, 35, 0.6)" stroke="#E8E8E8" strokeWidth="1.5" />
          
          {/* High-reflectivity coating effect */}
          <rect x="15" y="15" width="30" height="30" rx="2" fill="rgba(120, 120, 130, 0.1)" />
          
          {/* Reflective highlights */}
          <path d="M 20 20 L 34 34 M 20 36 L 34 20" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />
          
          {/* 45-degree internal reflector */}
          <line x1="32" y1="20" x2="18" y2="34" stroke="#4A90E2" strokeWidth="1" opacity="0.5" />
          
          {/* Mounting studs */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * Math.PI) / 3;
            const x = 30 + Math.cos(angle) * 22;
            const y = 30 + Math.sin(angle) * 22;
            return <circle key={i} cx={x} cy={y} r="1.5" fill="#7F8C8D" opacity="0.4" />;
          })}
          
          {/* Reflectivity indicator */}
          <text x="30" y="52" fill="#FBBF24" fontSize="5" fontWeight="600" textAnchor="middle">99.9%</text>
        </svg>
      );

    case "detector":
    case "single-photon-detector":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          {/* Photodetector housing */}
          <rect x="12" y="12" width="36" height="36" rx="4" fill="#1D1D1D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Sensitive surface */}
          <rect x="16" y="16" width="28" height="28" rx="2" fill="#2D2D2D" stroke="#48CF53" strokeWidth="0.5" />
          
          {/* Photodiode structure */}
          <circle cx="30" cy="30" r="8" fill="none" stroke="#48CF53" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="3" fill="#48CF53" />
          
          {/* Response indicator */}
          <circle cx="48" cy="18" r="1.5" fill="#FBBF24" opacity={isSimulating ? "1" : "0.3"}>
            <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
          </circle>
          
          {/* Detection status */}
          <text x="30" y="48" fill="#48CF53" fontSize="5" fontWeight="600" textAnchor="middle">
            {isSimulating ? "DETECTED" : "WAITING"}
          </text>
        </svg>
      );

    case "projection-screen":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 80" style={{ filter: glowEffect }}>
          {/* Screen surface */}
          <rect x="12" y="8" width="36" height="64" rx="2" fill="#2D2D2D" stroke="#48CF53" strokeWidth="1.5" />
          
          {/* Screen phosphor simulation */}
          <rect x="14" y="10" width="32" height="60" rx="1.5" fill="#3B82F6" opacity="0.15" />
          
          {/* Beam distortion effect */}
          <path d="M 28 40 Q 32 35 36 40 T 40 35 T 44 40" fill="none" stroke="rgba(71, 130, 196, 0.4)" strokeWidth="0.8" />
          
          {/* Resolution indicator */}
          <circle cx="30" cy="52" r="1.5" fill="#FBBF24" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          
          {/* Screen info */}
          <text x="30" y="68" fill="#48CF53" fontSize="5" fontWeight="600" textAnchor="middle">1080p</text>
          <text x="30" y="72" fill="#7F8C8D" fontSize="4" fontWeight="400" textAnchor="middle">Phosphor Screen</text>
        </svg>
      );

    case "phase-plate":
      return (
        <svg width="100%" height="100%" viewBox="0 0 50 60" style={{ filter: glowEffect }}>
          {/* Transparent plate */}
          <rect x="10" y="10" width="30" height="40" rx="3" fill="#1D1D1D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* Wave retardation effect */}
          <rect x="12" y="12" width="26" height="36" fill="rgba(72, 130, 196, 0.1)" />
          
          {/* Axis indicators */}
          <line x1="25" y1="16" x2="25" y2="44" stroke="#FBBF24" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="22" y1="30" x2="28" y2="30" stroke="#FBBF24" strokeWidth="0.8" strokeDasharray="2 2" />
          
          {/* Phase shift visualization */}
          <g opacity="0.7">
            <circle cx="25" cy="30" r="8" fill="none" stroke="#4A90E2" strokeWidth="0.5" />
            <path d="M 20 30 A 5 5 0 0 1 30 30 A 5 5 0 0 1 20 30" fill="none" stroke="#4A90E2" strokeWidth="0.8" />
          </g>
          
          <text x="25" y="54" fill="#4A90E2" fontSize="5" fontWeight="600" textAnchor="middle">90°</text>
          <text x="25" y="58" fill="#7F8C8D" fontSize="4" textAnchor="middle">Retarder</text>
        </svg>
      );

    case "counter":
      return (
        <svg width="100%" height="100%" viewBox="0 0 70 50" style={{ filter: glowEffect }}>
          {/* Digital counter display */}
          <rect x="8" y="12" width="54" height="26" rx="3" fill="#1D1D1D" stroke={strokeColor} strokeWidth="1.5" />
          
          {/* LED segments simulation */}
          <g opacity="0.8">
            <rect x="16" y="17" width="6" height="4" fill="#10B981" rx="1" />
            <rect x="24" y="17" width="6" height="4" fill="#10B981" rx="1" />
            <rect x="32" y="17" width="6" height="4" fill="#FBBF24" rx="1" />
            <rect x="16" y="23" width="6" height="4" fill="#10B981" rx="1" />
            <rect x="24" y="23" width="6" height="4" fill="#E5E7EB" rx="1" />
            <rect x="32" y="23" width="6" height="4" fill="#10B981" rx="1" />
            <rect x="16" y="29" width="6" height="4" fill="#10B981" rx="1" />
            <rect x="24" y="29" width="6" height="4" fill="#E5E7EB" rx="1" />
            <rect x="32" y="29" width="6" height="4" fill="#10B981" rx="1" />
          </g>
          
          {/* Display numbers */}
          <text x="34" y="27" fill="#10B981" fontSize="8" fontWeight="700" fontFamily="monospace">0</text>
          <text x="42" y="27" fill="#10B981" fontSize="8" fontWeight="700" fontFamily="monospace">0</text>
          <text x="50" y="27" fill="#FBBF24" fontSize="8" fontWeight="700" fontFamily="monospace">0</text>
          
          {/* Label */}
          <text x="35" y="41" fill="#7F8C8D" fontSize="5" textAnchor="middle">COUNTS/SEC</text>
          
          {/* Counter active indication */}
          {isSimulating && (
            <text x="35" y="45" fill="#FBBF24" fontSize="4" textAnchor="middle" fontStyle="italic">COUNTS</text>
          )}
        </svg>
      );

    case "probability-plot":
      return (
        <svg width="100%" height="100%" viewBox="0 0 70 60" style={{ filter: glowEffect }}>
          {/* Plot background */}
          <rect x="10" y="10" width="50" height="40" rx="2" fill="#1D1D1D" stroke="#4A90E2" strokeWidth="0.5" />
          
          {/* Y-axis */}
          <line x1="15" y1="50" x2="15" y2="10" stroke="#4A90E2" strokeWidth="0.8" />
          
          {/* X-axis */}
          <line x1="15" y1="50" x2="65" y2="50" stroke="#4A90E2" strokeWidth="0.8" />
          
          {/* Grid lines */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => {
            const y = 50 - (value / 100) * 40;
            return <line key={value} x1="15" y1={y} x2="65" y2={y} stroke="#4A90E2" strokeWidth="0.2" opacity="0.3" />;
          })}
          
          {/* Probability curve simulation */}
          <path
            d="M 15,50 C 20,35 30,35 35,50 S 45,65 65,50"
            fill="none"
            stroke="#5682C4"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Title */}
          <text x="35" y="58" fill="#5682C4" fontSize="5" fontWeight="600" textAnchor="middle">Probability Density</text>
        </svg>
      );

    case "potential-well":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 70" style={{ filter: glowEffect }}>
          {/* Confinement well */}
          <rect x="15" y="8" width="30" height="54" rx="2" fill="#2D2D2D" stroke="#48CF53" strokeWidth="1.5" />
          
          {/* Potential well shape (parabolic) */}
          <ellipse cx="30" cy="35" rx="14" ry="6" fill="rgba(72, 207, 83, 0.15)" />
          
          {/* Well boundaries */}
          <line x1="15" y1="35" x2="45" y2="35" stroke="#48CF53" strokeWidth="1" />
          <line x1="15" y1="20" x2="45" y2="20" stroke="#48CF53" strokeWidth="0.5" opacity="0.5" />
          <line x1="15" y1="50" x2="45" y2="50" stroke="#48CF53" strokeWidth="0.5" opacity="0.5" />
          
          <text x="30" y="60" fill="#48CF53" fontSize="5" fontWeight="600" textAnchor="middle">BOUND STATE</text>
        </svg>
      );

    case "infinite-wall":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          {/* Infinite barrier */}
          <line x1="30" y1="5" x2="30" y2="55" stroke="#EF4444" strokeWidth="2.5" opacity="0.8" />
          <line x1="28" y1="5" x2="32" y2="55" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="3" />
          
          <circle cx="30" cy="30" r="6" fill="rgba(239, 68, 68, 0.1)" />
          <text x="30" y="32" fill="#EF4444" fontSize="5" fontWeight="700" textAnchor="middle">∞</text>
          <text x="30" y="54" fill="#EF4444" fontSize="5" textAnchor="middle">INFINITE WALL</text>
        </svg>
      );

    case "state-viewer":
      return (
        <svg width="100%" height="100%" viewBox="0 0 80 50" style={{ filter: glowEffect }}>
          <rect x="8" y="12" width="64" height="26" rx="3" fill="#1D1D1D" stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="40" cy="25" r="6" fill="none" stroke="#5682C4" strokeWidth="1.5" />
          <circle cx="40" cy="25" r="1.5" fill="#5682C4" />
          <line x1="45" y1="25" x2="72" y2="25" stroke="#10B981" strokeWidth="1" opacity="0.7" />
          
          <text x="30" y="35" fill="#7F8C8D" fontSize="5">|Ψ⟩ =</text>
          <text x="48" y="35" fill="#E8E8E8" fontSize="6" fontWeight="600">α|0⟩+β|1⟩</text>
        </svg>
      );

    case "wavepacket-generator":
      return (
        <svg width="100%" height="100%" viewBox="0 0 90 50" style={{ filter: glowEffect }}>
          <rect x="6" y="8" width="78" height="34" rx="3" fill="#1D1D1D" stroke={strokeColor} strokeWidth="1.5" />
          <rect x="12" y="14" width="66" height="22" fill="#0F0F0F" stroke="#333" strokeWidth="0.5" />
          <path
            d="M 12,35 Q 18,25 24,35 T 30,25 T 36,35 T 42,25 T 48,35 T 54,25 T 60,35 T 66,25 T 72,35"
            fill="none"
            stroke="#5682C4"
            strokeWidth="1.5"
          />
          <text x="40" y="42" fill="#7F8C8D" fontSize="5" textAnchor="middle">WAVEPACKET</text>
        </svg>
      );

    default:
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 60" style={{ filter: glowEffect }}>
          <rect x="8" y="8" width="44" height="44" rx="3" fill="rgba(29, 29, 29, 0.7)" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="20" y1="20" x2="40" y2="40" stroke="rgba(232, 232, 232, 0.2)" strokeWidth="0.5" />
          <line x1="20" y1="40" x2="40" y2="20" stroke="rgba(232, 232, 232, 0.2)" strokeWidth="0.5" />
          <text x="30" y="54" fill="#7F8C8D" fontSize="5" textAnchor="middle">{svgId.replace(/-/g, ' ').toUpperCase()}</text>
        </svg>
      );
  }
};
