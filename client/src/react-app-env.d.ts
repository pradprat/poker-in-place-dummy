/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly PUBLIC_URL: string;
  }
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.sass" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface Window {
  webkitAudioContext: typeof AudioContext;
  mediaNotAvailableAlertShown: boolean;
}
interface LocalAudioTrack {
  _MediaStream: MediaStream;
}
declare namespace JSX {
  interface PiperRecorder {
    id: string;
    "pipe-width": string;
    "pipe-height": string;
    "pipe-qualityurl": string;
    "pipe-accounthash": string;
    "pipe-eid": string;
    "pipe-mrt": string;
    "pipe-dup": string;
  }
  interface IntrinsicElements {
    piperecorder: PiperRecorder;
  }
}

interface Console {
  defaultLog:
    | { (message?: any, ...optionalParams: any[]): void }
    | { (args: IArguments): void };
  defaultError:
    | { (message?: any, ...optionalParams: any[]): void }
    | { (args: IArguments): void };
  defaultWarn:
    | { (message?: any, ...optionalParams: any[]): void }
    | { (args: IArguments): void };
  logs: any[];
  errors: any[];
  warns: any[];
}

// declare module "@zoomus/websdk" {
//   export const ZoomMtg: any;
// }
