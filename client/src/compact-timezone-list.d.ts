declare module "compact-timezone-list" {
  export const minimalTimezoneSet: TimeZone[];
  export interface TimeZone {
    tzCode: string;
    label: string;
  }
}
