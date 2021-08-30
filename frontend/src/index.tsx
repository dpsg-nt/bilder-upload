import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";
import * as React from "react";
import ReactDOM from "react-dom";

import * as Sentry from "@sentry/react";

import { App } from "./App";
import { theme } from "./theme/theme";

if (window.location.hostname !== "localhost")
  Sentry.init({ dsn: "https://585fc4a63fbf4125b6dd9c5bb1bbce3a@o982758.ingest.sentry.io/5938207" });

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
