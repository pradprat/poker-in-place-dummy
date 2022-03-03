import { ShowCards } from "../engine/types";

export const getCardsToShow = ({ cards, show }: { cards: string[], show: ShowCards }) => {
  const [firstCard, secondCard] = cards;

  switch (show) {
    case ShowCards.First:
      return [firstCard]
    case ShowCards.Second:
      return [secondCard]
    case ShowCards.Both:
    default:
      return [firstCard, secondCard]
  }
}
