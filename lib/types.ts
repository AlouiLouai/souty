export type ScannerPhase =
  | "loading-model"
  | "requesting-camera"
  | "camera-denied"
  | "unsupported"
  | "error"
  | "ready";

export interface RecognizedGesture {
  id: string;
  label: string;
  word: string;
  confidence: number;
  timestamp: number;
}
