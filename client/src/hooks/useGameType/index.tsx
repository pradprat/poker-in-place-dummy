import React, { createContext, useContext, ReactNode } from "react";

import { GameType } from "../../engine/types";

export interface IGameTypeContext {
  gameType: GameType;
  mockFeaturedParticipants: boolean;
}
export const GameTypeContext = createContext<IGameTypeContext>(null);

interface GameTypeProps {
  type: GameType;
  mockFeaturedParticipants?: boolean;
  children: ReactNode;
}
export function GameTypeProvider({
  type,
  mockFeaturedParticipants,
  children,
}: GameTypeProps) {
  return (
    <GameTypeContext.Provider
      value={{
        gameType: type,
        mockFeaturedParticipants,
      }}
    >
      {children}
    </GameTypeContext.Provider>
  );
}

export default function useGameType() {
  const context = useContext(GameTypeContext) || {
    gameType: GameType.Cash,
    mockFeaturedParticipants: false,
  };

  return context;
}
