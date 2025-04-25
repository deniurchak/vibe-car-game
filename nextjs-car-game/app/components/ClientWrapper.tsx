"use client";

import dynamic from "next/dynamic";

// Dynamically import the CarGame component with no SSR
const CarGame = dynamic(() => import("./CarGame"), { ssr: false });

export default function ClientWrapper() {
  return <CarGame />;
}
