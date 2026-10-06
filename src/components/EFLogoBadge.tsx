import React from 'react';

interface EFLogoBadgeProps {
  className?: string;
  size?: number | string;
}

export const EFLogoBadge: React.FC<EFLogoBadgeProps> = ({
  className = '',
  size = '100%',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`select-none ${className}`}
      aria-label="EF CPA SHOP TOP-UP"
    >
      <defs>
        {/* Background Radial Gradient (Deep Royal Purple) */}
        <radialGradient id="badge-bg-leather" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#2d1354" />
          <stop offset="45%" stopColor="#1b0a33" />
          <stop offset="85%" stopColor="#100520" />
          <stop offset="100%" stopColor="#0a0214" />
        </radialGradient>

        {/* Metallic Purple Outer Bevel Gradient */}
        <linearGradient id="badge-purple-chrome" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="18%" stopColor="#8b5cf6" />
          <stop offset="35%" stopColor="#c084fc" />
          <stop offset="52%" stopColor="#581c87" />
          <stop offset="70%" stopColor="#a855f7" />
          <stop offset="88%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>

        {/* Chrome Rim Specular Flare Gradient */}
        <linearGradient id="badge-rim-flare" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="75%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
        </linearGradient>

        {/* EF Gradient (Bright Lavender to Royal Purple with 3D Bevel) */}
        <linearGradient id="badge-ef-serif-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="15%" stopColor="#e879f9" />
          <stop offset="45%" stopColor="#c084fc" />
          <stop offset="75%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>

        {/* Silver Chrome Text Gradient (CPA SHOP & TOP-UP) */}
        <linearGradient id="badge-silver-metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="68%" stopColor="#94a3b8" />
          <stop offset="88%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Silver Coin Top Ellipse Gradient */}
        <linearGradient id="badge-coin-face-grad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Silver Coin Standing Face */}
        <radialGradient id="badge-coin-stand-grad" cx="42%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="90%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>

        {/* Gamepad Purple Gradient */}
        <linearGradient id="badge-pad-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="30%" stopColor="#9333ea" />
          <stop offset="75%" stopColor="#6b21a8" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>

        {/* Filters for Realistic 3D Emboss & Shadows */}
        <filter id="badge-deep-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000000" floodOpacity="0.85" />
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.3" />
        </filter>

        <filter id="badge-text-3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.9" />
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
        </filter>

        <filter id="badge-icon-3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        <filter id="badge-flare-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* SQUIRCLE APP ICON CONTAINER */}
      <g filter="url(#badge-deep-shadow)">
        {/* Main Background */}
        <rect x="52" y="52" width="408" height="408" rx="88" ry="88" fill="url(#badge-bg-leather)" />

        {/* Subtle Texture Inset Pattern */}
        <rect x="56" y="56" width="400" height="400" rx="84" ry="84" fill="none" stroke="#381363" strokeWidth="2" opacity="0.6" />
        <rect x="62" y="62" width="388" height="388" rx="78" ry="78" fill="none" stroke="#1f0938" strokeWidth="1.5" opacity="0.8" />

        {/* Inner Metallic Inset Line */}
        <rect x="66" y="66" width="380" height="380" rx="74" ry="74" fill="none" stroke="#6b21a8" strokeWidth="2.5" opacity="0.9" />

        {/* HEAVY PURPLE CHROME DOUBLE BEVELED FRAME */}
        <rect x="52" y="52" width="408" height="408" rx="88" ry="88" fill="none" stroke="url(#badge-purple-chrome)" strokeWidth="16" />

        {/* Outer Chrome Edge Highlight */}
        <rect x="44" y="44" width="424" height="424" rx="96" ry="96" fill="none" stroke="#7e22ce" strokeWidth="2" opacity="0.7" />

        {/* TOP SPECULAR REFLECTION FLARE */}
        <g filter="url(#badge-flare-glow)">
          <path d="M 185 46 Q 256 42 327 46 Q 256 50 185 46 Z" fill="url(#badge-rim-flare)" />
          <circle cx="256" cy="46" r="3" fill="#ffffff" />
        </g>

        {/* BOTTOM SPECULAR REFLECTION FLARE */}
        <g filter="url(#badge-flare-glow)">
          <path d="M 205 466 Q 256 463 307 466 Q 256 469 205 466 Z" fill="url(#badge-rim-flare)" opacity="0.85" />
          <circle cx="256" cy="466" r="2.5" fill="#ffffff" opacity="0.9" />
        </g>
      </g>

      {/* LEFT: 3D PURPLE GAME CONTROLLER */}
      <g transform="translate(102, 172)" filter="url(#badge-icon-3d)">
        {/* Controller Body */}
        <path
          d="M 14 26 C 14 12, 26 8, 42 8 C 53 8, 61 12, 64 16 C 67 12, 75 8, 86 8 C 102 8, 114 12, 114 26 C 114 44, 102 66, 88 66 C 79 66, 75 58, 64 58 C 53 58, 49 66, 40 66 C 26 66, 14 44, 14 26 Z"
          fill="url(#badge-pad-grad)"
          stroke="#e879f9"
          strokeWidth="1.8"
        />

        {/* Top Gloss Highlight */}
        <path d="M 22 20 C 30 14, 45 13, 60 17" fill="none" stroke="#f5d0fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <path d="M 68 17 C 83 13, 98 14, 106 20" fill="none" stroke="#f5d0fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

        {/* Left: Cross D-Pad */}
        <path d="M 31 23 h 8 v -7 h 6 v 7 h 8 v 6 h -8 v 7 h -6 v -7 h -8 Z" fill="#1b0833" stroke="#d946ef" strokeWidth="1" />
        <circle cx="38" cy="26" r="1.2" fill="#c084fc" />

        {/* Right: 4 Action Buttons in Diamond Shape */}
        <circle cx="89" cy="20" r="3.2" fill="#1b0833" stroke="#f0abfc" strokeWidth="1.2" />
        <circle cx="98" cy="26" r="3.2" fill="#1b0833" stroke="#f0abfc" strokeWidth="1.2" />
        <circle cx="80" cy="26" r="3.2" fill="#1b0833" stroke="#f0abfc" strokeWidth="1.2" />
        <circle cx="89" cy="32" r="3.2" fill="#1b0833" stroke="#f0abfc" strokeWidth="1.2" />
      </g>

      {/* CENTER: "EF" IN LUXURY ROMAN SERIF (3D BEVEL) */}
      <g filter="url(#badge-text-3d)">
        <text
          x="256"
          y="224"
          fontFamily="'Playfair Display', 'Times New Roman', 'Georgia', serif"
          fontSize="126"
          fontWeight="900"
          fontStyle="normal"
          fill="url(#badge-ef-serif-grad)"
          stroke="#f5d0fe"
          strokeWidth="1.6"
          textAnchor="middle"
          letterSpacing="2"
        >
          EF
        </text>
      </g>

      {/* RIGHT: STACK OF SILVER COINS WITH $ SIGN */}
      <g transform="translate(334, 160)" filter="url(#badge-icon-3d)">
        {/* Coin 1 */}
        <ellipse cx="66" cy="62" rx="27" ry="10" fill="url(#badge-coin-face-grad)" stroke="#ffffff" strokeWidth="1" />
        <path d="M 39 62 v 7 c 0 5.5 12 10 27 10 s 27 -4.5 27 -10 v -7" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

        {/* Coin 2 */}
        <ellipse cx="66" cy="52" rx="27" ry="10" fill="url(#badge-coin-face-grad)" stroke="#ffffff" strokeWidth="1" />
        <path d="M 39 52 v 7 c 0 5.5 12 10 27 10 s 27 -4.5 27 -10 v -7" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

        {/* Coin 3 */}
        <ellipse cx="66" cy="42" rx="27" ry="10" fill="url(#badge-coin-face-grad)" stroke="#ffffff" strokeWidth="1" />
        <path d="M 39 42 v 7 c 0 5.5 12 10 27 10 s 27 -4.5 27 -10 v -7" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

        {/* Coin 4 (Top) */}
        <ellipse cx="66" cy="32" rx="27" ry="10" fill="url(#badge-coin-face-grad)" stroke="#ffffff" strokeWidth="1.2" />

        {/* Standing Front Coin with Dollar Sign */}
        <ellipse cx="44" cy="49" rx="24" ry="25" fill="#000000" opacity="0.4" />
        <ellipse cx="42" cy="47" rx="25" ry="26" fill="url(#badge-coin-stand-grad)" stroke="#ffffff" strokeWidth="2.2" />
        <ellipse cx="42" cy="47" rx="20.5" ry="21.5" fill="none" stroke="#64748b" strokeWidth="1.4" strokeDasharray="3,1.5" />
        <ellipse cx="42" cy="47" rx="18.5" ry="19.5" fill="none" stroke="#94a3b8" strokeWidth="0.8" />

        <text
          x="42"
          y="56"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          fontSize="26"
          fontWeight="900"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="0.8"
          textAnchor="middle"
        >
          $
        </text>
      </g>

      {/* TEXT: "CPA SHOP" (EMBOSSED 3D METALLIC SILVER) */}
      <g filter="url(#badge-text-3d)">
        <text
          x="256"
          y="286"
          fontFamily="'Montserrat', 'Arial Black', 'Prompt', sans-serif"
          fontSize="54"
          fontWeight="900"
          letterSpacing="2.5"
          fill="url(#badge-silver-metal-grad)"
          stroke="#ffffff"
          strokeWidth="1.8"
          textAnchor="middle"
        >
          CPA SHOP
        </text>
      </g>

      {/* TEXT: "TOP-UP" (CRISP METALLIC SILVER) */}
      <g filter="url(#badge-text-3d)">
        <text
          x="256"
          y="328"
          fontFamily="'Montserrat', 'Arial Black', 'Prompt', sans-serif"
          fontSize="28"
          fontWeight="900"
          letterSpacing="9"
          fill="url(#badge-silver-metal-grad)"
          stroke="#ffffff"
          strokeWidth="1"
          textAnchor="middle"
        >
          TOP-UP
        </text>
      </g>
    </svg>
  );
};
