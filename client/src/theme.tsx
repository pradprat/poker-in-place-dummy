import React from "react";
import { createMuiTheme, Link } from "@material-ui/core";

import Poker501Home from "./components/custom/Poker501Home";
import { GameMode, GameType } from "./engine/types";

declare module "@material-ui/core/styles/createMuiTheme" {
  interface Theme {
    sidebarWidth: number;
    sidebarMobileHeight: number;
  }

  // allow configuration using `createMuiTheme`
  interface ThemeOptions {
    sidebarWidth?: number;
    sidebarMobileHeight?: number;
  }
}

export function getThemeOverrides() {
  return (
    ThemeOverrides[window.location.hostname] || { palette: defaultPalette }
  );
}

const isGameModeSupportedByPartnerPoker501 = (
  mode: GameMode,
  type: GameType
) => {
  if (type !== GameType.Cash) return true;
  switch (mode) {
  case GameMode.Poker501_8_45:
    return true;
  case GameMode.Poker501_8_180:
    return true;
  }
  return false;
};

function DonateExplainerMessage() {
  return (
    <span>
      All donations will used to support our infrastructure with all excess
      going directly to our charity to help combat cancer. Thank you for your
      support.
      <br />
      {" "}
      <Link
        href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
          "nbclark@gmail.com"
        )}&currency_code=USD&item_name=${encodeURIComponent(
          "Poker501 Donation"
        )}`}
        target="_blank"
      >
        Send a small donation with PayPal
      </Link>
      {/* <br />
      <div>
        Venmo more your style? You can reach me at <b>@Nicholas-Clark-12</b>
      </div> */}
      <br />
      Thanks so much!
    </span>
  );
}

export const MiscOverrides: any = {
  "dev.pokerinplace.app": {
    cardBack: "/custom/poker501.com/1B.png",
    logo: "/custom/poker501.com/logo-white.png",
    logoDark: "/custom/poker501.com/poker501_icon.png",
    tableLogo: "/custom/poker501.com/poker501_logo-white.png",
    leftTableImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    rightTableImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    tournamentImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    tableCustomLogo1: "/custom/poker501.com/poker501_logo-white.png",
    favIcon: "/custom/poker501.com/favicon.ico",
    favIconPng: "/custom/poker501.com/favicon.png",
    touchIcon: "/custom/poker501.com/android-chrome-192x192.png",
    manifest: "/custom/poker501.com/manifest.json",
    title: "Poker501",
    stripeClientKey:
      "pk_live_51HZLcMA6IEn2uA6nFn1zvUqovBVYFV9j7dFCHiHEGZogKKzGMROvqK4SDZocsvqcmdoJpnuAynhqTtrAWFJ01zbE00U3NHY7cb",
    homeComponent: () => <Poker501Home />,
    showSliderBetting: true,
    isGameModeSupportedByPartner: isGameModeSupportedByPartnerPoker501,
    explainerMessage: "$5 of every paid game will be donated to charity to help combat cancer. Any additional donations will go straight to the cause.",
    donateExplainerMessage: DonateExplainerMessage,
    supportsLightMode: true,
  },
  "poker501.com": {
    cardBack: "/custom/poker501.com/1B.png",
    logo: "/custom/poker501.com/logo-white.png",
    logoDark: "/custom/poker501.com/poker501_icon.png",
    tableLogo: "/custom/poker501.com/poker501_logo-white.png",
    leftTableImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    rightTableImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    tournamentImageUrl: "/custom/poker501.com/poker501_logo-white.png",
    tableCustomLogo1: "/custom/poker501.com/poker501_logo-white.png",
    favIcon: "/custom/poker501.com/favicon.ico",
    favIconPng: "/custom/poker501.com/favicon.png",
    touchIcon: "/custom/poker501.com/android-chrome-192x192.png",
    manifest: "/custom/poker501.com/manifest.json",
    title: "Poker501",
    stripeClientKey:
      "pk_live_51HZLcMA6IEn2uA6nFn1zvUqovBVYFV9j7dFCHiHEGZogKKzGMROvqK4SDZocsvqcmdoJpnuAynhqTtrAWFJ01zbE00U3NHY7cb",
    homeComponent: () => <Poker501Home />,
    showSliderBetting: true,
    isGameModeSupportedByPartner: isGameModeSupportedByPartnerPoker501,
    explainerMessage: "$5 of every paid game will be donated to charity to help combat cancer. Any additional donations will go straight to the cause.",
    donateExplainerMessage: DonateExplainerMessage,
    supportsLightMode: true,
  },
  "alpha.poker501.com": {
    cardBack: "/custom/poker501.com/1B.png",
    logo: "/custom/poker501.com/logo-white.png",
    logoDark: "/custom/poker501.com/poker501_icon.png",
    tableLogo: "/custom/poker501.com/poker501_logo-white.png",
    favIcon: "/custom/poker501.com/favicon.ico",
    favIconPng: "/custom/poker501.com/favicon.png",
    touchIcon: "/custom/poker501.com/android-chrome-192x192.png",
    manifest: "/custom/poker501.com/manifest.json",
    title: "Poker501",
    stripeClientKey:
      "pk_live_51HZLcMA6IEn2uA6nFn1zvUqovBVYFV9j7dFCHiHEGZogKKzGMROvqK4SDZocsvqcmdoJpnuAynhqTtrAWFJ01zbE00U3NHY7cb",
    homeComponent: () => <Poker501Home />,
    showSliderBetting: true,
    isGameModeSupportedByPartner: isGameModeSupportedByPartnerPoker501,
    explainerMessage: "$5 of every paid game will be donated to charity to help combat cancer. Any additional donations will go straight to the cause.",
    donateExplainerMessage: DonateExplainerMessage,
    supportsLightMode: true,
  },
  localhost: {
    cardBack: "/custom/poker501.com/1B.png",
    logo: "/custom/poker501.com/logo-white.png",
    logoDark: "/custom/poker501.com/poker501_icon.png",
    tableLogo: "/custom/poker501.com/poker501_logo-white.png",
    favIcon: "/custom/poker501.com/favicon.ico",
    favIconPng: "/custom/poker501.com/favicon.png",
    touchIcon: "/custom/poker501.com/android-chrome-192x192.png",
    manifest: "/custom/poker501.com/manifest.json",
    title: "Poker501",
    stripeClientKey:
      "pk_test_51HZLcMA6IEn2uA6nzrN2tqZq0sBm0r8taopRHGl2tRSASa0WyF8Bhm4B91PhVWjb8ApH27usHJ3mIqjpOYwRoQ7T00v7Bznnpa",
    homeComponent: () => <Poker501Home />,
    showSliderBetting: true,
    isGameModeSupportedByPartner: isGameModeSupportedByPartnerPoker501,
    explainerMessage: "$5 of every paid game will be donated to charity to help combat cancer. Any additional donations will go straight to the cause.",
    donateExplainerMessage: DonateExplainerMessage,
    supportsLightMode: true,
  },
};

export const CSSOverrides: any = {
  "dev.pokerinplace.app": "/style/poker501.css",
  "alpha.poker501.com": "/style/poker501.css",
  "poker501.com": "/style/poker501.css",
  localhost: "/style/poker501.css",
  "poker-in-place-stage.web.app": "/style/stage.css",
};

export const ThemeOverrides: any = {
  "dev.pokerinplace.app": {
    palette: {
      contrastThreshold: 3,
      type: "dark",
      secondary: { main: "#F2C847" },
      primary: { main: "rgba(0, 141, 230, 1)" },
      // background: { default: "#05a7e2", paper: "#fff" },
      background: { default: "rgba(7,42,64,1)", paper: "rgba(20,55,77,1)" },
    },
    typography: {
      fontFamily: [
        "Poppins-Regular",
        "apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        "sans-serif",
      ].join(","),
    },
  },
  "alpha.poker501.com": {
    palette: {
      contrastThreshold: 3,
      type: "dark",
      secondary: { main: "#F2C847" },
      primary: { main: "rgba(0, 141, 230, 1)" },
      // background: { default: "#05a7e2", paper: "#fff" },
      background: { default: "rgba(7,42,64,1)", paper: "rgba(20,55,77,1)" },
    },
    typography: {
      fontFamily: [
        "Poppins-Regular",
        "apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        "sans-serif",
      ].join(","),
    },
  },
  "poker501.com": {
    palette: {
      contrastThreshold: 3,
      type: "dark",
      secondary: { main: "#F2C847" },
      primary: { main: "rgba(0, 141, 230, 1)" },
      // background: { default: "#05a7e2", paper: "#fff" },
      background: { default: "rgba(7,42,64,1)", paper: "rgba(20,55,77,1)" },
    },
    typography: {
      fontFamily: [
        "Poppins-Regular",
        "apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        "sans-serif",
      ].join(","),
    },
  },
  localhost: {
    palette: {
      contrastThreshold: 3,
      type: "dark",
      secondary: { main: "#F2C847" },
      primary: { main: "rgba(0, 141, 230, 1)" },
      // background: { default: "#05a7e2", paper: "#fff" },
      background: { default: "rgba(7,42,64,1)", paper: "rgba(20,55,77,1)" },
    },
    typography: {
      fontFamily: [
        "Poppins-Regular",
        "apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        "sans-serif",
      ].join(","),
    },
  },
};

const defaultPalette = {
  type: "dark",
  primary: {
    main: "#689e87",
    dark: "#3b6f5a",
    light: "#97cfb7",
  },
  secondary: {
    main: "#bff489",
    dark: "#8dc15a",
    light: "#f3ffba",
  },
  // background: {
  //   default: "#262626",
  //   paper: "#3d3d3d",
  // },
  background: { default: "rgba(7,42,64,1)", paper: "rgba(20,55,77,1)" },
};

export function createThemeFromOverrides(overrides: any) {
  return createMuiTheme({
    palette: {
      ...defaultPalette,
    },
    sidebarWidth: 260,
    transitions: {
      // So we have `transition: none;` everywhere
      create: () => "none",
    },
    sidebarMobileHeight: 90,
    ...overrides,
  });
}

export function createTheme(
  primaryColor: string,
  secondaryColor: string,
  options: {
    backgroundColor?: string;
    primaryColorLight?: string;
    primaryColorDark?: string;
    secondaryColorLight?: string;
    secondaryColorDark?: string;
  } = {}
) {
  return createMuiTheme({
    palette: {
      type: "dark",
      primary: {
        main: primaryColor,
        dark: options.primaryColorDark || primaryColor,
        light: options.primaryColorLight || primaryColor,
      },
      secondary: {
        main: secondaryColor,
        dark: options.secondaryColorDark || secondaryColor,
        light: options.secondaryColorLight || secondaryColor,
      },
      background: {
        default: options.backgroundColor || "#303030",
      },
    },
    sidebarWidth: 260,
    transitions: {
      // So we have `transition: none;` everywhere
      create: () => "none",
    },
    sidebarMobileHeight: 90,
  });
}

// export default createTheme("#32a86f", "#a8326b");
export default createThemeFromOverrides({});
