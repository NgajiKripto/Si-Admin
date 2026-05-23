"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  baseDelay?: number;
  staggerInterval?: number;
}

export function StaggerReveal({
  children,
  className,
  baseDelay = 0,
  staggerInterval = 100,
}: StaggerRevealProps) {
  const childArray = React.Children.toArray(children);

  return (
    <>
      {childArray.map((child, index) => (
        <div
          key={index}
          className={cn("animate-stagger-fade-in", className)}
          style={{
            "--stagger-delay": `${baseDelay + index * staggerInterval}ms`,
          } as React.CSSProperties}
        >
          {child}
        </div>
      ))}
    </>
  );
}
