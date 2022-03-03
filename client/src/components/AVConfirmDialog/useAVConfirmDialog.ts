import { useContext } from "react";

import Context from "./context";

function useDialog() {
  return useContext(Context);
}

export default useDialog;
