"use client";

import React from "react";
import { motion } from "framer-motion";

interface PerformanceRingProps {
  percentage: number;
  avatarUrl?: string | null;
  name: string;
  size?: number;
  strokeWidth?: number;
}

export const PerformanceRing: React.FC<PerformanceRingProps> = ({
  percentage,
  avatarUrl,
  name,
  size = 130,
  strokeWidth = 9,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const initialLetter = name.charAt(0).toUpperCase() || "C";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Ring Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#5B50E5"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      {/* Center Avatar Container */}
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#5B50E5] to-[#3730A3] border-4 shadow-md transition-colors"
        style={{
          width: size - strokeWidth * 2.8,
          height: size - strokeWidth * 2.8,
          borderColor: 'var(--surface)',
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
            {initialLetter}
          </span>
        )}
      </div>

      {/* Floating Percentage Badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        className="absolute -top-1 -right-1 bg-[#5B50E5] text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow-lg shadow-[#5B50E5]/30 border-2"
        style={{ borderColor: 'var(--surface)' }}
      >
        {percentage}%
      </motion.div>
    </div>
  );
};
