import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AnyAction, Dispatch } from "redux";

import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = (): Dispatch<AnyAction> => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;