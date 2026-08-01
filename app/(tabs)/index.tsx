import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../../constants/theme";
import { useAuth } from "../../lib/auth";

const TAILLE_MAX = 8 * 1024 * 1024; // 8 Mo

function lireEnBase64(uri: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const reponse = await fetch(uri);
      const blob = await reponse.blob();
      const lecteur = new FileReader();
      lecteur.onerror = () => reject(new Error("Lecture impossible"));
      lecteur.onloadend = () => {
        const resultat = String(lecteur.result ?? "");
        const virgule = resultat.indexOf(",");
        resolve(virgule >= 0 ? resultat.slice(virgule + 1) : resultat);
      };
      lecteur.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

export default function Accueil() {
  const router = useRouter();
  const { session } = useAuth();
  const [preparationPdf, setPreparationPdf] = useState(false);

  const nomComplet = (session?.user?.user_metadata?.nom_complet as string) ?? "";
  const prenom = nomComplet.trim().split(" ")[0] || "Citoyen";
  const initiale = (nomComplet.trim() || "C").charAt(0).toUpperCase();

  const importerPdf = async () => {
    if (preparationPdf) return;

    try {
      const choix = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (choix.canceled) return;
      const fichier = choix.assets?.[0];
      if (!fichier?.uri) return;

      if (fichier.size && fichier.size > TAILLE_MAX) {
        Alert.alert(
          "Document trop volumineux",
          "Ce PDF dépasse 8 Mo. Essayez un fichier plus léger, ou scannez les pages avec l'appareil photo."
        );
        return;
      }

      setPreparationPdf(true);
      const pdf = await lireEnBase64(fichier.uri);
      router.push({ pathname: "/analyse", params: { pdf } });
    } catch (e: any) {
      console.log(">>> Erreur import PDF:", e?.message ?? e);
      Alert.alert(
        "Impossible de lire le document",
        "Ce fichier n'a pas pu être ouvert. Essayez un autre PDF, ou scannez les pages avec l'appareil photo."
      );
    } finally {
      setPreparationPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>

        {/* En-tête */}
        <View style={styles.entete}>
          <Text style={styles.marque}>
            Consent<Text style={styles.marqueOr}>IA</Text>
          </Text>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profil")}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarTexte}>{initiale}</Text>
          </TouchableOpacity>
        </View>

        {/* Accroche */}
        <View style={styles.accroche}>
          <Text style={styles.salutation}>Bonjour {prenom},</Text>
          <Text style={styles.titre}>
            Votre <Text style={styles.titreOr}>bouclier</Text>{"\n"}numérique
          </Text>
          <Text style={styles.sousTitre}>
            Analysez n'importe quel document avant de le signer.
          </Text>
        </View>

        {/* Action principale */}
        <TouchableOpacity
          style={styles.carteOr}
          onPress={() => router.push("/(tabs)/scanner")}
          activeOpacity={0.85}
        >
          <View style={styles.carteOrIcone}>
            <Feather name="camera" size={24} color={Couleurs.texteSurOr} />
          </View>
          <Text style={styles.carteOrTitre}>Scanner un document</Text>
          <Text style={styles.carteOrTexte}>
            Photographiez un contrat, ConsentIA l'analyse en quelques secondes.
          </Text>
        </TouchableOpacity>

        {/* Deux raccourcis */}
        <View style={styles.ligne}>
          <TouchableOpacity
            style={styles.mini}
            onPress={importerPdf}
            disabled={preparationPdf}
            activeOpacity={0.8}
          >
            <View style={styles.miniIcone}>
              {preparationPdf ? (
                <ActivityIndicator color={Couleurs.or} size="small" />
              ) : (
                <Feather name="file-text" size={19} color={Couleurs.or} />
              )}
            </View>
            <Text style={styles.miniTitre}>Importer{"\n"}un PDF</Text>
            <Text style={styles.miniTexte}>
              {preparationPdf ? "Préparation…" : "Depuis vos fichiers"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mini}
            onPress={() => router.push("/(tabs)/historique")}
            activeOpacity={0.8}
          >
            <View style={styles.miniIcone}>
              <Feather name="clock" size={19} color={Couleurs.or} />
            </View>
            <Text style={styles.miniTitre}>Mon{"\n"}historique</Text>
            <Text style={styles.miniTexte}>Vos analyses</Text>
          </TouchableOpacity>
        </View>

        {/* Domaines */}
        <Text style={styles.sectionTitre}>DOMAINES COUVERTS</Text>
        {DOMAINES.map((d) => (
          <View key={d.libelle} style={styles.domaine}>
            <View style={styles.domaineIcone}>
              <Feather name={d.icone} size={17} color={Couleurs.or} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.domaineTexte}>{d.libelle}</Text>
              <Text style={styles.domaineRef}>{d.reference}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const DOMAINES = [
  { icone: "lock" as const, libelle: "Données personnelles", reference: "Loi n°2013-450 · ARTCI" },
  { icone: "home" as const, libelle: "Bail & habitation", reference: "Code de l'habitat 2019-576" },
  { icone: "briefcase" as const, libelle: "Travail & emploi", reference: "Code du travail 2015-532" },
  { icone: "credit-card" as const, libelle: "Crédit & sûretés", reference: "Acte uniforme OHADA" },
  { icone: "shield" as const, libelle: "Assurance", reference: "Code CIMA" },
];

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { paddingBottom: Espacements.xxl },

  entete: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Espacements.lg, paddingTop: Espacements.sm,
  },
  marque: { color: Couleurs.texte, fontSize: 23, fontWeight: Typo.gras, letterSpacing: -0.3 },
  marqueOr: { color: Couleurs.or },
  avatar: {
    width: 40, height: 40, borderRadius: Rayons.rond,
    backgroundColor: Couleurs.orSombre,
    alignItems: "center", justifyContent: "center",
  },
  avatarTexte: { color: Couleurs.texteSurOr, fontSize: 17, fontWeight: Typo.gras },

  accroche: { paddingHorizontal: Espacements.lg, paddingTop: Espacements.lg + 4 },
  salutation: { color: Couleurs.texteSecondaire, fontSize: 14, fontWeight: Typo.moyen, marginBottom: 8 },
  titre: { color: Couleurs.texte, fontSize: Typo.titreXL, fontWeight: Typo.semiGras, lineHeight: 35, marginBottom: 10 },
  titreOr: { color: Couleurs.or },
  sousTitre: { color: Couleurs.texteSecondaire, fontSize: 14, lineHeight: 21 },

  carteOr: {
    marginHorizontal: Espacements.lg, marginTop: Espacements.lg,
    backgroundColor: Couleurs.orSombre, borderRadius: Rayons.xl, padding: Espacements.lg,
  },
  carteOrIcone: {
    width: 50, height: 50, borderRadius: Rayons.md,
    backgroundColor: "rgba(10,33,56,0.14)",
    alignItems: "center", justifyContent: "center", marginBottom: Espacements.md,
  },
  carteOrTitre: { color: Couleurs.texteSurOr, fontSize: Typo.titreM, fontWeight: Typo.gras, marginBottom: 5 },
  carteOrTexte: { color: "#2A4A6C", fontSize: 13, lineHeight: 19, maxWidth: "85%" },

  ligne: { flexDirection: "row", gap: 14, paddingHorizontal: Espacements.lg, marginTop: 14 },
  mini: {
    flex: 1, borderRadius: Rayons.lg, padding: 18,
    backgroundColor: Couleurs.fondCarte,
    borderWidth: 1, borderColor: Couleurs.fondCarteBordure,
  },
  miniIcone: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Couleurs.orTransparent,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  miniTitre: { color: Couleurs.texte, fontSize: 14.5, fontWeight: Typo.semiGras, lineHeight: 18 },
  miniTexte: { color: Couleurs.texteSecondaire, fontSize: 11.5, marginTop: 3 },

  sectionTitre: {
    color: Couleurs.texteTernaire, fontSize: Typo.legende, fontWeight: Typo.semiGras,
    letterSpacing: 1.2, paddingHorizontal: Espacements.lg, marginTop: Espacements.lg + 4, marginBottom: 12,
  },
  domaine: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: Espacements.lg, marginBottom: 10,
    borderRadius: Rayons.md, paddingVertical: 13, paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: Couleurs.bordure,
  },
  domaineIcone: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(227,190,106,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  domaineTexte: { color: Couleurs.texte, fontSize: 14.5, fontWeight: Typo.moyen },
  domaineRef: { color: Couleurs.texteTernaire, fontSize: 11, marginTop: 2 },
});