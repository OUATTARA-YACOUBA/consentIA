import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";

type Props = {
  titre: string;
  texte: string;
  icone: keyof typeof Feather.glyphMap;
};

export default function EcranProvisoire({ titre, texte, icone }: Props) {
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.centre}>
        <View style={styles.pastille}>
          <Feather name={icone} size={30} color={Couleurs.or} />
        </View>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.texte}>{texte}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: Espacements.xl },
  pastille: {
    width: 72, height: 72, borderRadius: Rayons.lg,
    backgroundColor: Couleurs.orTransparent,
    borderWidth: 1, borderColor: "rgba(227,190,106,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: Espacements.lg,
  },
  titre: { color: Couleurs.texte, fontSize: Typo.titreL, fontWeight: Typo.semiGras, marginBottom: 8 },
  texte: { color: Couleurs.texteSecondaire, fontSize: Typo.corps, textAlign: "center", lineHeight: 22 },
});
