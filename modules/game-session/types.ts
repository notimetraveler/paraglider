import type { FlightState } from "@/modules/flight-model/types";

/** Session state for UI */
export interface SessionState {
  flightState: FlightState;
  airtime: number;
}
