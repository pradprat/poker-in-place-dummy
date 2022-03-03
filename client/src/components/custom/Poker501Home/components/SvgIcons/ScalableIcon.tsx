import React, { FunctionComponent, memo } from "react";

const ScalableIconComponent: FunctionComponent = () => (
  <svg
    width="64" height="64"
    viewBox="0 0 64 64" fill="none"
    xmlns="http://www.w3.org/2000/svg" className="svg-icon"
  >
    <path d="M44.8002 19.2H19.2002V44.7999H44.8002V19.2Z" fill="currentColor" />
    <path d="M60.8 35.2C62.72 35.2 64 33.92 64 32C64 30.4 62.72 28.8 60.8 28.8H57.6V22.4H60.8C62.72 22.4 64 21.12 64 19.2C64 17.6 62.72 16 60.8 16H57.6V12.8C57.6 9.28 54.72 6.4 51.2 6.4H48V3.2C48 1.6 46.72 0 44.8 0C43.2 0 41.6 1.28 41.6 3.2V6.4H35.2V3.2C35.2 1.6 33.92 0 32 0C30.08 0 28.8 1.28 28.8 3.2V6.4H22.4V3.2C22.4 1.6 21.12 0 19.2 0C17.28 0 16 1.28 16 3.2V6.4H12.8C9.28 6.4 6.4 9.28 6.4 12.8V16H3.2C1.28 16 0 17.28 0 19.2C0 20.8 1.28 22.4 3.2 22.4H6.4V28.8H3.2C1.28 28.8 0 30.08 0 32C0 33.6 1.28 35.2 3.2 35.2H6.4V41.6H3.2C1.28 41.6 0 42.88 0 44.8C0 46.4 1.28 48 3.2 48H6.4V51.2C6.4 54.72 9.28 57.6 12.8 57.6H16V60.8C16 62.4 17.28 64 19.2 64C21.12 64 22.4 62.72 22.4 60.8V57.6H28.8V60.8C28.8 62.4 30.08 64 32 64C33.92 64 35.2 62.72 35.2 60.8V57.6H41.6V60.8C41.6 62.4 42.88 64 44.8 64C46.4 64 48 62.72 48 60.8V57.6H51.2C54.72 57.6 57.6 54.72 57.6 51.2V48H60.8C62.72 48 64 46.72 64 44.8C64 43.2 62.72 41.6 60.8 41.6H57.6V35.2H60.8ZM51.2 51.2H12.8V12.8H51.2V51.2Z" fill="currentColor" />
  </svg>
);
export const ScalableIcon = memo(ScalableIconComponent);