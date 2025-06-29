import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TestScreenProps {
  text: string;
}

export default function TestScreen({ text }: TestScreenProps) {
  return (
    <View>
      <Text>{text}</Text>
    </View>
  );
}
