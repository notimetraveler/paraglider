/** Post-flight score summary */
export interface ScoreSummary {
  airtime: number;
  maxAltitude: number;
  /** Max horizontal distance from launch (m) */
  distance: number;
}
