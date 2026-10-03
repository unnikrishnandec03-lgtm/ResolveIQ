import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const DigitalPurpleConnectionBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`absolute inset-0 pointer-events-none select-none overflow-hidden transition-colors duration-500 z-0 ${
      isDark ? 'bg-[#0a0118]' : 'bg-[#faf8ff]'
    }`}>
      {/* High-fidelity Digital Purple Connection Network (Adaptive for Light & Dark) */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Deep ambient void background */}
          <radialGradient id="dpc-ambient-glow" cx="50%" cy="5%" r="85%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.85" />
                <stop offset="20%" stopColor="#581c87" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#2e0854" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#140226" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#080012" stopOpacity="1" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#e9d5ff" stopOpacity="0.7" />
                <stop offset="55%" stopColor="#f3e8ff" stopOpacity="0.85" />
                <stop offset="80%" stopColor="#faf5ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </>
            )}
          </radialGradient>

          {/* Top bright light source flare */}
          <radialGradient id="top-core-light" cx="50%" cy="0%" r="45%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.9" />
                <stop offset="15%" stopColor="#d8b4fe" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#a855f7" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#7e22ce" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="20%" stopColor="#c084fc" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#9333ea" stopOpacity="0.3" />
                <stop offset="80%" stopColor="#7c3aed" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
              </>
            )}
          </radialGradient>

          {/* Linear ray gradients */}
          <linearGradient id="ray-grad-left" x1="50%" y1="0%" x2="15%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#c084fc' : '#9333ea'} stopOpacity={isDark ? 0.3 : 0.22} />
            <stop offset="50%" stopColor={isDark ? '#9333ea' : '#a855f7'} stopOpacity={isDark ? 0.1 : 0.08} />
            <stop offset="100%" stopColor={isDark ? '#3b0764' : '#e9d5ff'} stopOpacity="0" />
          </linearGradient>

          <linearGradient id="ray-grad-right" x1="50%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#c084fc' : '#9333ea'} stopOpacity={isDark ? 0.3 : 0.22} />
            <stop offset="50%" stopColor={isDark ? '#9333ea' : '#a855f7'} stopOpacity={isDark ? 0.1 : 0.08} />
            <stop offset="100%" stopColor={isDark ? '#3b0764' : '#e9d5ff'} stopOpacity="0" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="neon-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Gradient Canvas */}
        <rect width="1920" height="1080" fill="url(#dpc-ambient-glow)" />

        {/* 2. Volumetric Perspective Light Rays Streaming Down */}
        <path d="M960 0 L300 1080 L600 1080 Z" fill="url(#ray-grad-left)" opacity={isDark ? 0.75 : 0.6} />
        <path d="M960 0 L1320 1080 L1620 1080 Z" fill="url(#ray-grad-right)" opacity={isDark ? 0.75 : 0.6} />
        <path d="M960 0 L750 1080 L1170 1080 Z" fill="url(#top-core-light)" opacity={isDark ? 0.6 : 0.5} />

        {/* 3. Top Core Light Burst */}
        <ellipse cx="960" cy="0" rx="550" ry="240" fill="url(#top-core-light)" />

        {/* 4. The 3D Digital Purple Connection Polygonal Mesh */}
        <g stroke={isDark ? '#a855f7' : '#7e22ce'} strokeWidth={isDark ? '1.2' : '1.4'} opacity={isDark ? 0.65 : 0.55} filter="url(#line-glow)">
          {/* Layer 1: High Perspective Ring (Closest to source ceiling) */}
          <path d="M720 40 L840 70 L960 85 L1080 70 L1200 40" stroke={isDark ? '#d8b4fe' : '#9333ea'} strokeWidth="1.6" />
          <path d="M640 100 L760 140 L880 165 L960 170 L1040 165 L1160 140 L1280 100" stroke={isDark ? '#c084fc' : '#7c3aed'} strokeWidth="1.4" />

          {/* Layer 2: Mid-Perspective Concentric Geometric Web */}
          <path d="M500 160 L650 220 L800 260 L960 270 L1120 260 L1270 220 L1420 160" />
          <path d="M380 230 L550 310 L740 365 L960 380 L1180 365 L1370 310 L1540 230" />
          <path d="M260 320 L450 420 L680 490 L960 510 L1240 490 L1470 420 L1660 320" />
          <path d="M160 430 L360 550 L620 635 L960 660 L1300 635 L1560 550 L1760 430" />

          {/* Perspective Longitudinal Converging Rays connecting rings */}
          <line x1="960" y1="0" x2="960" y2="660" stroke={isDark ? '#e9d5ff' : '#6b21a8'} strokeWidth="1.6" />
          <line x1="840" y1="70" x2="620" y2="635" />
          <line x1="1080" y1="70" x2="1300" y2="635" />
          <line x1="760" y1="140" x2="360" y2="550" />
          <line x1="1160" y1="140" x2="1560" y2="550" />
          <line x1="640" y1="100" x2="160" y2="430" />
          <line x1="1280" y1="100" x2="1760" y2="430" />

          {/* Cross Diagonal Web Triangulation Struts */}
          <line x1="720" y1="40" x2="760" y2="140" />
          <line x1="840" y1="70" x2="760" y2="140" />
          <line x1="840" y1="70" x2="880" y2="165" />
          <line x1="960" y1="85" x2="880" y2="165" />
          <line x1="960" y1="85" x2="1040" y2="165" />
          <line x1="1080" y1="70" x2="1040" y2="165" />
          <line x1="1080" y1="70" x2="1160" y2="140" />
          <line x1="1200" y1="40" x2="1160" y2="140" />

          <line x1="760" y1="140" x2="650" y2="220" />
          <line x1="880" y1="165" x2="800" y2="260" />
          <line x1="960" y1="170" x2="800" y2="260" />
          <line x1="960" y1="170" x2="1120" y2="260" />
          <line x1="1040" y1="165" x2="1120" y2="260" />
          <line x1="1160" y1="140" x2="1270" y2="220" />

          <line x1="650" y1="220" x2="550" y2="310" />
          <line x1="800" y1="260" x2="740" y2="365" />
          <line x1="960" y1="270" x2="740" y2="365" />
          <line x1="960" y1="270" x2="1180" y2="365" />
          <line x1="1120" y1="260" x2="1180" y2="365" />
          <line x1="1270" y1="220" x2="1370" y2="310" />

          <line x1="550" y1="310" x2="450" y2="420" />
          <line x1="740" y1="365" x2="680" y2="490" />
          <line x1="960" y1="380" x2="680" y2="490" />
          <line x1="960" y1="380" x2="1240" y2="490" />
          <line x1="1180" y1="365" x2="1240" y2="490" />
          <line x1="1370" y1="310" x2="1470" y2="420" />

          <line x1="450" y1="420" x2="360" y2="550" />
          <line x1="680" y1="490" x2="620" y2="635" />
          <line x1="960" y1="510" x2="620" y2="635" />
          <line x1="960" y1="510" x2="1300" y2="635" />
          <line x1="1240" y1="490" x2="1300" y2="635" />
          <line x1="1470" y1="420" x2="1560" y2="550" />

          {/* Outer edge polygonal wings */}
          <line x1="160" y1="430" x2="100" y2="540" />
          <line x1="100" y1="540" x2="220" y2="670" />
          <line x1="220" y1="670" x2="360" y2="550" />

          <line x1="1760" y1="430" x2="1820" y2="540" />
          <line x1="1820" y1="540" x2="1700" y2="670" />
          <line x1="1700" y1="670" x2="1560" y2="550" />
        </g>

        {/* 5. Glowing Neon Purple Nodes (Vertices) */}
        <g filter="url(#neon-node-glow)">
          {/* Top Cluster Nodes */}
          <circle cx="960" cy="85" r="4.5" fill={isDark ? '#ffffff' : '#6b21a8'} />
          <circle cx="840" cy="70" r="4" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="1080" cy="70" r="4" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="720" cy="40" r="3.5" fill={isDark ? '#e9d5ff' : '#9333ea'} />
          <circle cx="1200" cy="40" r="3.5" fill={isDark ? '#e9d5ff' : '#9333ea'} />

          {/* Second Ring Nodes */}
          <circle cx="960" cy="170" r="4.5" fill={isDark ? '#ffffff' : '#6b21a8'} />
          <circle cx="880" cy="165" r="4" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="1040" cy="165" r="4" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="760" cy="140" r="4" fill={isDark ? '#e9d5ff' : '#9333ea'} />
          <circle cx="1160" cy="140" r="4" fill={isDark ? '#e9d5ff' : '#9333ea'} />
          <circle cx="640" cy="100" r="3.5" fill={isDark ? '#d8b4fe' : '#a855f7'} />
          <circle cx="1280" cy="100" r="3.5" fill={isDark ? '#d8b4fe' : '#a855f7'} />

          {/* Third Ring Nodes */}
          <circle cx="960" cy="270" r="5" fill={isDark ? '#ffffff' : '#6b21a8'} />
          <circle cx="800" cy="260" r="4.5" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="1120" cy="260" r="4.5" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="650" cy="220" r="4" fill={isDark ? '#e9d5ff' : '#9333ea'} />
          <circle cx="1270" cy="220" r="4" fill={isDark ? '#e9d5ff' : '#9333ea'} />
          <circle cx="500" cy="160" r="4" fill={isDark ? '#c084fc' : '#a855f7'} />
          <circle cx="1420" cy="160" r="4" fill={isDark ? '#c084fc' : '#a855f7'} />

          {/* Fourth Ring Nodes */}
          <circle cx="960" cy="380" r="5" fill={isDark ? '#ffffff' : '#6b21a8'} />
          <circle cx="740" cy="365" r="4.5" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="1180" cy="365" r="4.5" fill={isDark ? '#f3e8ff' : '#7c3aed'} />
          <circle cx="550" cy="310" r="4.5" fill={isDark ? '#d8b4fe' : '#9333ea'} />
          <circle cx="1370" cy="310" r="4.5" fill={isDark ? '#d8b4fe' : '#9333ea'} />
          <circle cx="380" cy="230" r="4" fill={isDark ? '#c084fc' : '#a855f7'} />
          <circle cx="1540" cy="230" r="4" fill={isDark ? '#c084fc' : '#a855f7'} />

          {/* Fifth Ring Nodes */}
          <circle cx="960" cy="510" r="5.5" fill={isDark ? '#ffffff' : '#581c87'} />
          <circle cx="680" cy="490" r="5" fill={isDark ? '#f3e8ff' : '#6b21a8'} />
          <circle cx="1240" cy="490" r="5" fill={isDark ? '#f3e8ff' : '#6b21a8'} />
          <circle cx="450" cy="420" r="4.5" fill={isDark ? '#d8b4fe' : '#7c3aed'} />
          <circle cx="1470" cy="420" r="4.5" fill={isDark ? '#d8b4fe' : '#7c3aed'} />
          <circle cx="260" cy="320" r="4" fill={isDark ? '#a855f7' : '#9333ea'} />
          <circle cx="1660" cy="320" r="4" fill={isDark ? '#a855f7' : '#9333ea'} />

          {/* Bottom Horizon Nodes */}
          <circle cx="960" cy="660" r="5" fill={isDark ? '#ffffff' : '#581c87'} />
          <circle cx="620" cy="635" r="4.5" fill={isDark ? '#f3e8ff' : '#6b21a8'} />
          <circle cx="1300" cy="635" r="4.5" fill={isDark ? '#f3e8ff' : '#6b21a8'} />
          <circle cx="360" cy="550" r="4.5" fill={isDark ? '#d8b4fe' : '#7c3aed'} />
          <circle cx="1560" cy="550" r="4.5" fill={isDark ? '#d8b4fe' : '#7c3aed'} />
          <circle cx="160" cy="430" r="4" fill={isDark ? '#a855f7' : '#9333ea'} />
          <circle cx="1760" cy="430" r="4" fill={isDark ? '#a855f7' : '#9333ea'} />
          <circle cx="100" cy="540" r="3.5" fill={isDark ? '#9333ea' : '#7c3aed'} />
          <circle cx="1820" cy="540" r="3.5" fill={isDark ? '#9333ea' : '#7c3aed'} />
          <circle cx="220" cy="670" r="3.5" fill={isDark ? '#9333ea' : '#7c3aed'} />
          <circle cx="1700" cy="670" r="3.5" fill={isDark ? '#9333ea' : '#7c3aed'} />
        </g>

        {/* 6. Soft vignette overlay ensuring the central login form has pristine contrast and legibility */}
        <radialGradient id="center-contrast-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isDark ? '#0a0118' : '#ffffff'} stopOpacity={isDark ? 0.45 : 0.25} />
          <stop offset="60%" stopColor={isDark ? '#0a0118' : '#ffffff'} stopOpacity={isDark ? 0.2 : 0.05} />
          <stop offset="100%" stopColor={isDark ? '#0a0118' : '#faf5ff'} stopOpacity={isDark ? 0.65 : 0.4} />
        </radialGradient>
        <rect width="1920" height="1080" fill="url(#center-contrast-vignette)" />

        {/* Bottom deep gradient fade */}
        <linearGradient id="bottom-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#0a0118' : '#faf8ff'} stopOpacity="0" />
          <stop offset="65%" stopColor={isDark ? '#0a0118' : '#faf8ff'} stopOpacity={isDark ? 0.4 : 0.3} />
          <stop offset="100%" stopColor={isDark ? '#080012' : '#f5f0ff'} stopOpacity={isDark ? 0.95 : 0.85} />
        </linearGradient>
        <rect y="450" width="1920" height="630" fill="url(#bottom-fade)" />
      </svg>
    </div>
  );
};
