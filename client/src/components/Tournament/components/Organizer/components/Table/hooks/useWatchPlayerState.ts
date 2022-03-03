import { useEffect, useState } from "react";

import { IGame, IHand, IPlayerState } from "../../../../../../../engine/types";
import { firebaseWatchPlayerState } from "../../../../../../../Game";

const useWatchPlayerState = (table: IGame, activeHand: IHand): IPlayerState => {
  const [playerState, setPlayerState] = useState<IPlayerState>(null);

  useEffect(() => {
    if (!activeHand?.actingPlayerId) {
      return (): void => {}
    }

    const watchPlayerState = firebaseWatchPlayerState;
    const unwatchPlayer = watchPlayerState(
      table.id,
      activeHand.id,
      activeHand.actingPlayerId
    ).onSnapshot((state) => {
      setPlayerState(state);
    });

    return (): void => {
      unwatchPlayer();
    };
  }, [activeHand?.actingPlayerId])

  return playerState;
}

export default useWatchPlayerState;