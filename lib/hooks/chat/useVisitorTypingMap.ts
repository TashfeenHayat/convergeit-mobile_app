import { useEffect, useState } from "react";
import {
  subscribeVisitorTyping,
  type VisitorTypingState,
} from "./agent-visitor-typing-bus";

export function useVisitorTypingMap(): Map<string, VisitorTypingState> {
  const [map, setMap] = useState<Map<string, VisitorTypingState>>(new Map());

  useEffect(() => subscribeVisitorTyping(setMap), []);

  return map;
}
