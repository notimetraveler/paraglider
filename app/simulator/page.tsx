"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InputManager } from "@/components/InputManager";
import { SimulatorShell } from "@/components/SimulatorShell";

function SimulatorPageContent() {
  const searchParams = useSearchParams();
  const sessionKey = searchParams.toString();

  return (
    <InputManager key={sessionKey}>
      <div className="fixed inset-0 overflow-hidden">
        <SimulatorShell key={sessionKey} />
      </div>
    </InputManager>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={null}>
      <SimulatorPageContent />
    </Suspense>
  );
}
