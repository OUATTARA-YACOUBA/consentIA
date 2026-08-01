import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";
import { supabase } from "../lib/supabase";

export default function Analyse() {
  const { images, pdf } = useLocalSearchParams<{ images?: string; pdf?: string }>();
  const router = useRouter();
  const pulsation = useRef(new Animated.Value(0)).current;
  const dejaLance = useRef(false);

  // Animation de pulsation du bouclier
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsation, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulsation, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Appel à l'analyse (images déjà converties, ou PDF déjà encodé)
  useEffect(() => {
    if (dejaLance.current) return;
    dejaLance.current = true;

    (async () => {
      try {
        const corps = pdf
          ? { pdf }
          : { images: JSON.parse(images ?? "[]") as string[] };

        const { data, error } = await supabase.functions.invoke("analyser", { body: corps });

        if (error || data?.erreur) {
          router.replace({
            pathname: "/resultat",
            params: { erreur: data?.erreur ?? "Le service n'a pas répondu. Vérifiez votre connexion et réessayez." },
          });
          return;
        }

        router.replace({ pathname: "/resultat", params: { data: JSON.stringify(data) } });
      } catch {
        router.replace({
          pathname: "/resultat",
          params: { erreur: "Une erreur est survenue. Réessayez dans un instant." },
        });
      }
    })();
  }, []);

  const echelle = pulsation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const halo = pulsation.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.centre}>
        <View style={styles.zoneIcone}>
          <Animated.View style={[styles.halo, { opacity: halo, transform: [{ scale: echelle }] }]} />
          <Animated.View style={[styles.pastille, { transform: [{ scale: echelle }] }]}>
            <Feather name="shield" size={40} color={Couleurs.or} />
          </Animated.View>
        </View>

        <Text style={styles.titre}>Analyse en cours…</Text>
        <Text style={styles.texte}>
          ConsentIA lit votre document et le confronte au droit applicable en Côte d'Ivoire.
        </Text>

        <View style={styles.rassurance}>
          <Feather name="lock" size={14} color={Couleurs.conforme} />
          <Text style={styles.rassuranceTexte}>
            Votre document n'est pas conservé. Il est effacé dès l'analyse terminée.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: Espacements.xl },

  zoneIcone: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: Espacements.xl },
  halo: {
    position: "absolute", width: 140, height: 140, borderRadius: Rayons.rond,
    backgroundColor: Couleurs.or,
  },
  pastille: {
    width: 92, height: 92, borderRadius: Rayons.rond,
    backgroundColor: Couleurs.orTransparent,
    borderWidth: 1, borderColor: "rgba(227,190,106,0.35)",
    alignItems: "center", justifyContent: "center",
  },

  titre: { color: Couleurs.texte, fontSize: Typo.titreL, fontWeight: Typo.semiGras, marginBottom: 10 },
  texte: {
    color: Couleurs.texteSecondaire, fontSize: Typo.corps, textAlign: "center",
    lineHeight: 22, maxWidth: 300,
  },

  rassurance: {
    flexDirection: "row", alignItems: "center", gap: 9,
    marginTop: Espacements.xl, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: Couleurs.conformeFond, borderRadius: Rayons.md,
    maxWidth: 320,
  },
  rassuranceTexte: { flex: 1, color: Couleurs.texteSecondaire, fontSize: Typo.legende, lineHeight: 17 },
});