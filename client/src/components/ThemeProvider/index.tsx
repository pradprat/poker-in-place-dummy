import React, { createContext, useContext, useState } from "react";
import { MuiThemeProvider } from "@material-ui/core/styles";

import defaultTheme, {
  createThemeFromOverrides,
  ThemeOverrides,
  createTheme,
} from "../../theme";

export interface ThemeContextType {
  setCustomCss(css: string): void;
  setCustomColors(primary: string, secondary: string): void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

export default function ThemeProvider(props: React.PropsWithChildren<{}>) {
  const [css, setCustomCss] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [theme, setTheme] = useState(defaultTheme);

  const setCustomColors = React.useCallback(
    (primary: string, secondary: string) => {
      setPrimaryColor(primary);
      setSecondaryColor(secondary);
    },
    []
  );

  React.useEffect(() => {
    let applyTheme = defaultTheme;
    if (primaryColor && secondaryColor) {
      applyTheme = createTheme(primaryColor, secondaryColor);
    } else if (ThemeOverrides[window.location.hostname]) {
      applyTheme = createThemeFromOverrides(
        ThemeOverrides[window.location.hostname]
      );
    }
    setTheme(applyTheme);
  }, [primaryColor, secondaryColor, css]);

  const contextValue = {
    css,
    setCustomCss,
    setCustomColors,
  } as ThemeContextType;

  return (
    <ThemeContext.Provider value={{ ...contextValue }}>
      <MuiThemeProvider theme={theme}>
        {css && (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{ __html: css }}
          />
        )}
        {props.children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeProvider() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeProvider must be used within the ThemeProvider");
  }
  return context;
}
