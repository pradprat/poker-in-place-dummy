import { useEffect, useState } from "react";

import { IGame, IHand } from "../../../../../../../engine/types";
import { firebaseWatchHand } from "../../../../../../../Game";

const useWatchActiveHand = (table: IGame): IHand => {
  const [activeHand, setActiveHand] = useState<IHand>(null);

  const activeHandId = table?.activeHandId;
  const tableId = table?.id;

  useEffect(() => {
    if (!activeHandId || !tableId) {
      setActiveHand(null);
      return (): void => {};
    }

    const unwatchHands = firebaseWatchHand(
      tableId,
      activeHandId
    ).onSnapshot((hand) => {
      setActiveHand(hand);
    });

    return (): void => {
      unwatchHands();
    };
  }, [tableId, activeHandId]);

  return activeHand;
}

export default useWatchActiveHand;