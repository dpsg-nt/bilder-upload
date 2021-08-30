import { Theme } from "@material-ui/core/styles/createTheme";
import { unstable_createMuiStrictModeTheme as createTheme } from "@material-ui/core/styles";

export const mainPrimary = "#003056";
export const mainSecondary = "#b61f29";

export const theme: Theme = createTheme({
  palette: {
    primary: {
      main: mainPrimary,
    },
    info: {
      main: mainPrimary,
    },
    secondary: {
      main: mainSecondary,
    },
  },
});
