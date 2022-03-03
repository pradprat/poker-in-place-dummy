import { IAction } from "../../../../../../engine/types";

export const randomIntFromInterval = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min)

export const getRandomAction = (actions: IAction[]): IAction => actions[Math.floor(Math.random()*actions.length)];