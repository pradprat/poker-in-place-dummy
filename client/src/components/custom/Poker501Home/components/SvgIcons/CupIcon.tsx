import React, { FunctionComponent, memo } from "react";

const CupIconComponent: FunctionComponent = () => (
  <svg
    width="36" height="36"
    viewBox="0 0 36 36" fill="none"
    xmlns="http://www.w3.org/2000/svg" className="svg-icon"
  >
    <path d="M34.2 1.79988H28.8V-0.00012207H7.2V1.79988H1.8C0.72 1.79988 0 2.51988 0 3.59988V7.91988C0 12.0599 3.06 15.4799 7.2 16.0199V16.1999C7.2 21.4199 10.8 25.7399 15.66 26.8199L14.4 30.5999H10.26C9.54 30.5999 8.82 31.1399 8.64 31.8599L7.2 35.9999H28.8L27.36 31.8599C27.18 31.1399 26.46 30.5999 25.74 30.5999H21.6L20.34 26.8199C25.2 25.7399 28.8 21.4199 28.8 16.1999V16.0199C32.94 15.4799 36 12.0599 36 7.91988V3.59988C36 2.51988 35.28 1.79988 34.2 1.79988ZM7.2 12.4199C5.22 11.8799 3.6 10.0799 3.6 7.91988V5.39988H7.2V12.4199ZM32.4 7.91988C32.4 10.0799 30.78 12.0599 28.8 12.4199V5.39988H32.4V7.91988Z" fill="currentColor" />
  </svg>
);

export const CupIcon = memo(CupIconComponent);