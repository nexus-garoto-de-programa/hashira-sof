"use client";

import React, { useEffect, useRef } from "react";

interface DotGridProps {
  dotColor?: string;
  gridGap?: number;
  baseRadius?: number;
  activeRadius?: number;
  interactionDistance?: number;
}

export const DotGridCanvas: React.FC<DotGridProps> = ({
  gridGap = 32,
  baseRadius = 1.8,
  activeRadius = 4.5,
  interactionDistance = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    interface GridDot {
      x: number;
      y: number;
      ox: number;
      oy: number;
      vx: number;
      vy: number;
      currentRadius: number;
      targetRadius: number;
      currentOpacity: number;
      targetOpacity: number;
    }

    let dots: GridDot[] = [];

    const initGrid = () => {
      dots = [];
      const cols = Math.ceil(width / gridGap) + 1;
      const rows = Math.ceil(height / gridGap) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridGap;
          const y = j * gridGap;
          dots.push({
            x,
            y,
            ox: x,
            oy: y,
            vx: 0,
            vy: 0,
            currentRadius: baseRadius,
            targetRadius: baseRadius,
            currentOpacity: 0.12,
            targetOpacity: 0.12,
          });
        }
      }
    };

    initGrid();

    const getDotColor = (): [number, number, number] => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      return isDark ? [139, 124, 248] : [91, 80, 229]; // #8B7CF8 for dark, #5B50E5 for light
    };

    const render = () => {
      mouseX += (targetMouseX - mouseX) * 0.15;
      mouseY += (targetMouseY - mouseY) * 0.15;

      ctx.clearRect(0, 0, width, height);

      const [r, g, b] = getDotColor();

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouseX - dot.ox;
        const dy = mouseY - dot.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < interactionDistance && mouseX > 0 && mouseY > 0) {
          const force = 1 - dist / interactionDistance;
          const angle = Math.atan2(dy, dx);

          const pushX = Math.cos(angle) * force * 16;
          const pushY = Math.sin(angle) * force * 16;

          const targetX = dot.ox - pushX;
          const targetY = dot.oy - pushY;

          dot.vx += (targetX - dot.x) * 0.2;
          dot.vy += (targetY - dot.y) * 0.2;
          dot.targetRadius = baseRadius + (activeRadius - baseRadius) * force;
          dot.targetOpacity = 0.12 + 0.48 * force;
        } else {
          dot.vx += (dot.ox - dot.x) * 0.1;
          dot.vy += (dot.oy - dot.y) * 0.1;
          dot.targetRadius = baseRadius;
          dot.targetOpacity = 0.12;
        }

        dot.vx *= 0.82;
        dot.vy *= 0.82;
        dot.x += dot.vx;
        dot.y += dot.vy;

        dot.currentRadius += (dot.targetRadius - dot.currentRadius) * 0.2;
        dot.currentOpacity += (dot.targetOpacity - dot.currentOpacity) * 0.2;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.5, dot.currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.currentOpacity.toFixed(3)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridGap, baseRadius, activeRadius, interactionDistance]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Interactive Dot Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Ambient Organic Blurred Blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
        style={{ background: "radial-gradient(circle, #5B50E5 0%, rgba(91,80,229,0) 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #A78BFA 0%, rgba(167,139,250,0) 70%)" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #3730A3 0%, rgba(55,48,163,0) 70%)" }}
      />
    </div>
  );
};
