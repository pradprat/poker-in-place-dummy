const toDoubleDigit = (value: number): string => value < 10 ? `0${value}` : String(value)

export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds - minutes * 60;

  return `${toDoubleDigit(minutes)}:${toDoubleDigit(remainderSeconds)}`;
}
