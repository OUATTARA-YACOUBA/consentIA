import { ErrorBoundaryProps, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import EcranErreur from "../components/EcranErreur";
import { Couleurs } from "../constants/theme";
import { FournisseurAuth, useAuth } from "../lib/auth";

// Filet de sécurité : remplace le plantage brut par un écran propre
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <EcranErreur error={error} retry={retry} />
    </SafeAreaProvider>
  );
}

function Navigation() {
  const { session, chargement, onboardingVu } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (chargement || onboardingVu === null) return;

    const dansOnboarding = segments[0] === "onboarding";
    const dansAuth = segments[0] === "(auth)";

    // Première ouverture : on présente l'application
    if (!onboardingVu) {
      if (!dansOnboarding) router.replace("/onboarding");
      return;
    }

    if (!session && !dansAuth) {
      router.replace("/(auth)/connexion");
    } else if (session && (dansAuth || dansOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [session, chargement, onboardingVu, segments]);

  if (chargement || onboardingVu === null) {
    return (
      <View style={styles.attente}>
        <ActivityIndicator color={Couleurs.or} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Couleurs.fond },
      }}
    />
  );
}

export default function LayoutRacine() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <FournisseurAuth>
        <Navigation />
      </FournisseurAuth>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  attente: {
    flex: 1,
    backgroundColor: Couleurs.fond,
    alignItems: "center",
    justifyContent: "center",
  },
});