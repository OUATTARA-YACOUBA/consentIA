import { Stack } from "expo-router";
import { Couleurs } from "../../constants/theme";

export default function LayoutAuth() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Couleurs.fond },
      }}
    />
  );
}