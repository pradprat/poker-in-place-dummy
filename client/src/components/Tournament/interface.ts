import { IHand, ShowCards } from "../../engine/types";

export interface IOnShowCardsParams {
  hand: IHand;
  show: ShowCards;
}
