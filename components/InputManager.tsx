"use client";

import {
  useEffect,
  useCallback,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  createEmptyInputState,
  rawToControlInputs,
  isControlKey,
  getControlForKey,
  type RawInputState,
  type ControlInputs,
  type KeyCode,
} from "@/modules/input";

interface InputContextValue {
  raw: RawInputState;
  controls: ControlInputs;
}

const InputContext = createContext<InputContextValue | null>(null);

export function useInput(): InputContextValue {
  const ctx = useContext(InputContext);
  if (!ctx) throw new Error("useInput must be used within InputManager");
  return ctx;
}

interface InputManagerProps {
  children: ReactNode;
}

/**
 * Input abstraction layer - keyboard to control intentions.
 * Down = brake (both toggles), Up = accelerated flight (speed bar).
 * Left/Right = steering.
 */
export function InputManager({ children }: InputManagerProps) {
  const [raw, setRaw] = useState<RawInputState>(createEmptyInputState);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isControlKey(e.code)) return;
    e.preventDefault();
    const control = getControlForKey(e.code as KeyCode);
    setRaw((prev) => ({ ...prev, [control]: true }));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isControlKey(e.code)) return;
    e.preventDefault();
    const control = getControlForKey(e.code as KeyCode);
    setRaw((prev) => ({ ...prev, [control]: false }));
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const controls = rawToControlInputs(raw);
  const value: InputContextValue = { raw, controls };

  return (
    <InputContext.Provider value={value}>{children}</InputContext.Provider>
  );
}
