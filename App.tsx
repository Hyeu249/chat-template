import React from "react";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "./LanguageContext";
import { PaperProvider } from "react-native-paper";

import Navigation from "./navigation";

export default function App() {
  return (
    <LanguageProvider>
      <PaperProvider>
        <Navigation />
        <StatusBar style="auto" />
      </PaperProvider>
    </LanguageProvider>
  );
}
