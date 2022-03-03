import React, { createContext, useContext, ReactNode } from "react";

export interface IMockingContext {
  isMocking: boolean;
}
export const MockingContext = createContext<IMockingContext>(null);

interface MockingProps {
  isMocking: boolean;
  children: ReactNode;
}
export function MockingProvider({ isMocking, children }: MockingProps) {
  return (
    <MockingContext.Provider
      value={{
        isMocking,
      }}
    >
      {children}
    </MockingContext.Provider>
  );
}

export default function useMockingState() {
  const context = useContext(MockingContext) || { isMocking: false };

  return context;
}
