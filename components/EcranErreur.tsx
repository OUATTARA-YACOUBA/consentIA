import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";

type Props = {
  error: Error;
  retry: () => void;
};

export default function EcranErreur({ error, retry }: Props) {
  return (
    <SafeAreaView style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>

        <View style={styles.pastille}>
          <Feather name="alert-triangle" size={34} color={Couleurs.or} />
        </View>

        <Text style={styles.titre}>Une erreur est survenue</Text>

        <Text style={styles.texte}>
          ConsentIA a rencontré un problème inattendu. Aucune de vos données n'a été
          perdue, et vos documents n'ont jamais été conservés.
        </Text>

        <TouchableOpacity style={styles.bouton} onPress={retry} activeOpacity={0.85}>
          <Feather name="refresh-cw" size={18} color={Couleurs.texteSurOr} />
          <Text style={styles.boutonTexte}>Réessayer</Text>
        </TouchableOpacity>

        <Text style={styles.aide}>
          Si le problème persiste, fermez complètement l'application puis rouvrez-la.
        </Text>

        {__DEV__ && (
          <View style={styles.detail}>
            <Text style={styles.detailTitre}>Détail technique (développement)</Text>
            <Text style={styles.detailTexte}>{error?.message ?? String(error)}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Espacements.xl,
  },

  pastille: {
    width: 80,
    height: 80,
    borderRadius: Rayons.lg,
    backgroundColor: Couleurs.orTransparent,
    borderWidth: 1,
    borderColor: "rgba(227,190,106,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Espacements.lg,
  },

  titre: {
    color: Couleurs.texte,
    fontSize: Typo.titreM,
    fontWeight: Typo.semiGras,
    textAlign: "center",
    marginBottom: 12,
  },
  texte: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.corps,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Espacements.xl,
  },

  bouton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Couleurs.orSombre,
    borderRadius: Rayons.md,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  boutonTexte: {
    color: Couleurs.texteSurOr,
    fontSize: Typo.corps,
    fontWeight: Typo.gras,
  },

  aide: {
    color: Couleurs.texteTernaire,
    fontSize: Typo.legende,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Espacements.lg,
    maxWidth: 280,
  },

  detail: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: Rayons.sm,
    padding: Espacements.md,
    marginTop: Espacements.xl,
    width: "100%",
  },
  detailTitre: {
    color: Couleurs.texteTernaire,
    fontSize: 10,
    fontWeight: Typo.semiGras,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailTexte: {
    color: Couleurs.texteSecondaire,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
  },
});