import { useEffect, useState } from "react";
import firebase from "firebase";

import { IGame } from "../engine/types";

const useWatchActiveTable = (tableId: string): IGame => {
  const [table, setTable] = useState<IGame>(null);

  useEffect(() => {
    const unwatchActiveTable = firebase
      .firestore()
      .collection("tables")
      .doc(tableId)
      .onSnapshot((tableSnapshot) => {
        setTable(tableSnapshot.data() as IGame);
      });
    return (): void => unwatchActiveTable();
  }, []);

  return table;
}

export default useWatchActiveTable;