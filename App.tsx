import React from "react";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./LanguageContext";

import Navigation from "./navigation";

export default function App() {
  return (
    <LanguageProvider>
      <Navigation />
      <StatusBar style="auto" />
    </LanguageProvider>
  );
}
