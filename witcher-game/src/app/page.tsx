"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the Game component with no SSR
// This is necessary because Three.js uses browser APIs
const Game = dynamic(
  () => import("@/components/game/Game").then((mod) => ({ default: mod.Game })),
  {
    ssr: false,
  }
);

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Game />
    </main>
  );
}
