import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";
import { useAuth } from "../lib/auth";

const LARGEUR = Dimensions.get("window").width;

type Ecran = {
  cle: string;
  icone: keyof typeof Feather.glyphMap;
  badges: { icone: keyof typeof Feather.glyphMap; couleur: string; position: object }[];
  titreDebut: string;
  titreAccent: string;
  titreFin: string;
  texte: string;
};

const ECRANS: Ecran[] = [
  {
    cle: "probleme",
    icone: "file-text",
    badges: [
      { icone: "alert-triangle", couleur: Couleurs.danger, position: { top: -6, right: -10 } },
    ],
    titreDebut: "Vous signez des documents que vous ne ",
    titreAccent: "comprenez pas",
    titreFin: ".",
    texte:
      "Conditions à rallonge, clauses cachées, langage juridique. Chaque jour, vos droits sont en jeu sans que vous le sachiez.",
  },
  {
    cle: "solution",
    icone: "shield",
    badges: [
      { icone: "camera", couleur: Couleurs.or, position: { bottom: 10, right: -14 } },
      { icone: "check-circle", couleur: Couleurs.conforme, position: { bottom: -4, left: -12 } },
    ],
    titreDebut: "ConsentIA ",
    titreAccent: "les lit pour vous",
    titreFin: ".",
    texte:
      "Photographiez un document. En quelques secondes, l'intelligence artificielle repère les clauses dangereuses et vous explique vos droits, en mots simples.",
  },
  {
    cle: "confiance",
    icone: "book",
    badges: [
      { icone: "lock", couleur: Couleurs.conforme, position: { top: 4, right: -12 } },
    ],
    titreDebut: "Fondé sur le ",
    titreAccent: "droit ivoirien",
    titreFin: ".",
    texte:
      "Données personnelles, bail, travail, crédit, assurance : chaque analyse s'appuie sur le droit applicable en Côte d'Ivoire. Vos documents ne sont jamais conservés.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { marquerOnboardingVu } = useAuth();
  const [index, setIndex] = useState(0);
  const listeRef = useRef<FlatList<Ecran>>(null);

  const dernier = index === ECRANS.length - 1;

  const suivant = () => {
    if (dernier) return;
    listeRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const terminer = async (destination: "/(auth)/inscription" | "/(auth)/connexion") => {
    await marquerOnboardingVu();
    router.replace(destination);
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top", "bottom"]}>

      {!dernier && (
        <TouchableOpacity
          style={styles.passer}
          onPress={() => terminer("/(auth)/connexion")}
          activeOpacity={0.7}
        >
          <Text style={styles.passerTexte}>Passer</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listeRef}
        data={ECRANS}
        keyExtractor={(e) => e.cle}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / LARGEUR));
        }}
        getItemLayout={(_, i) => ({ length: LARGEUR, offset: LARGEUR * i, index: i })}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.zoneIllustration}>
              <View style={styles.cercle}>
                <Feather name={item.icone} size={82} color={Couleurs.or} />
                {item.badges.map((b, i) => (
                  <View key={i} style={[styles.badge, b.position]}>
                    <Feather name={b.icone} size={20} color={b.couleur} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.bas}>
        <View style={styles.points}>
          {ECRANS.map((_, i) => (
            <View key={i} style={[styles.point, i === index && styles.pointActif]} />
          ))}
        </View>

        <Text style={styles.titre}>
          {ECRANS[index].titreDebut}
          <Text style={styles.titreAccent}>{ECRANS[index].titreAccent}</Text>
          {ECRANS[index].titreFin}
        </Text>

        <Text style={styles.texte}>{ECRANS[index].texte}</Text>

        {dernier ? (
          <>
            <TouchableOpacity
              style={styles.bouton}
              onPress={() => terminer("/(auth)/inscription")}
              activeOpacity={0.85}
            >
              <Text style={styles.boutonTexte}>Créer mon compte</Text>
              <Feather name="arrow-right" size={18} color={Couleurs.texteSurOr} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boutonSecondaire}
              onPress={() => terminer("/(auth)/connexion")}
              activeOpacity={0.8}
            >
              <Text style={styles.boutonSecondaireTexte}>J'ai déjà un compte</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.bouton} onPress={suivant} activeOpacity={0.85}>
            <Text style={styles.boutonTexte}>Continuer</Text>
            <Feather name="arrow-right" size={18} color={Couleurs.texteSurOr} />
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },

  passer: {
    position: "absolute",
    top: Espacements.xl + 12,
    right: Espacements.lg,
    zIndex: 10,
    padding: 8,
  },
  passerTexte: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.corpsPetit,
    fontWeight: Typo.moyen,
  },

  page: { width: LARGEUR, flex: 1 },
  zoneIllustration: { flex: 1, alignItems: "center", justifyContent: "center" },
  cercle: {
    width: 220,
    height: 220,
    borderRadius: Rayons.rond,
    backgroundColor: "rgba(227,190,106,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,190,106,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    backgroundColor: Couleurs.fondProfond,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: Rayons.md,
    padding: 12,
  },

  bas: { paddingHorizontal: Espacements.xl, paddingBottom: Espacements.lg },
  points: { flexDirection: "row", gap: 8, marginBottom: Espacements.lg },
  point: {
    width: 8,
    height: 8,
    borderRadius: Rayons.rond,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pointActif: { width: 26, borderRadius: 5, backgroundColor: Couleurs.or },

  titre: {
    color: Couleurs.texte,
    fontSize: Typo.titreXL,
    fontWeight: Typo.semiGras,
    lineHeight: 35,
    marginBottom: 14,
  },
  titreAccent: { color: Couleurs.or },
  texte: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.corps,
    lineHeight: 23,
    marginBottom: Espacements.xl,
    minHeight: 92,
  },

  bouton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Couleurs.orSombre,
    borderRadius: Rayons.md,
    paddingVertical: 17,
  },
  boutonTexte: {
    color: Couleurs.texteSurOr,
    fontSize: Typo.corps,
    fontWeight: Typo.gras,
  },
  boutonSecondaire: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: Rayons.md,
    paddingVertical: 16,
    marginTop: 12,
  },
  boutonSecondaireTexte: {
    color: Couleurs.texte,
    fontSize: Typo.corpsPetit,
    fontWeight: Typo.semiGras,
  },
});