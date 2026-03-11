"use client";

import { InputManager } from "@/components/InputManager";
import { SimulatorShell } from "@/components/SimulatorShell";

export default function SimulatorPage() {
  return (
    <InputManager>
      <div className="fixed inset-0 overflow-hidden">
        <SimulatorShell />
      </div>
    </InputManager>
  );
}
