import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./components/App";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { store } from "./store/store";
import { Notifications } from "@mantine/notifications";

const container = document.getElementById("app");
if (!container) {
  throw new Error("Failed to find the root element");
}

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, Courier, monospace",
  colors: {
    dark: [
      '#C1C2C5', // dark.0 - lightest text
      '#A6A7AB', // dark.1 - light text
      '#909296', // dark.2 - muted text
      '#5c5f66', // dark.3 - disabled text
      '#373A40', // dark.4 - borders
      '#2C2E33', // dark.5 - input backgrounds
      '#25262b', // dark.6 - card backgrounds
      '#1A1B1E', // dark.7 - panel backgrounds (sidebar)
      '#141517', // dark.8 - main background
      '#0f1011', // dark.9 - darkest
    ],
  },
  primaryColor: 'blue',
  defaultRadius: 'sm',
  other: {
    // Cursor IDE specific colors
    cursorBackground: '#1e1e1e',
    cursorSidebar: '#252526',
    cursorBorder: '#3e3e42',
    cursorAccent: '#007acc',
    cursorText: '#cccccc',
    cursorMutedText: '#969696',
  },
});

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <Notifications />
        <App />
      </MantineProvider>
    </Provider>
  </React.StrictMode>
);
