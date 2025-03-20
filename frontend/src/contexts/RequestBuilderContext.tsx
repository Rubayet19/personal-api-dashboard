import { useState, ReactNode, useEffect } from "react";
import { RequestBuilderContext, initialState, type RequestBuilderState } from "./request-builder-context";
import { isAuthenticated } from "../lib/auth";

export function RequestBuilderProvider({ children }: { children: ReactNode }) {
  const [state, setFullState] = useState<RequestBuilderState>(() => {
    // Only restore state from localStorage if user is authenticated
    if (isAuthenticated()) {
      const savedState = localStorage.getItem("requestBuilderState");
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (e) {
          console.error("Failed to parse saved request builder state:", e);
        }
      }
    }
    return initialState;
  });

  useEffect(() => {
    // Only save state to localStorage if user is authenticated
    if (isAuthenticated()) {
      localStorage.setItem("requestBuilderState", JSON.stringify(state));
    }
  }, [state]);

  const setState = (newState: Partial<RequestBuilderState>) => {
    setFullState((prevState) => ({ ...prevState, ...newState }));
  };

  const resetState = () => {
    setFullState(initialState);
    localStorage.removeItem("requestBuilderState");
  };

  return (
    <RequestBuilderContext.Provider value={{ state, setState, resetState }}>
      {children}
    </RequestBuilderContext.Provider>
  );
}
