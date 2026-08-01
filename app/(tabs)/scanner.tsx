import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../../constants/theme";

export default function Scanner() {
  const [permission, demanderPermission] = useCameraPermissions();
  const [pages, setPages] = useState<string[]>([]);
  const [preparation, setPreparation] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // --- Permission pas encore accordée ---
  if (!permission) return <View style={styles.ecran} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <View style={styles.centre}>
          <View style={styles.pastille}>
            <Feather name="camera-off" size={30} color={Couleurs.or} />
          </View>
          <Text style={styles.titrePerm}>Accès à l'appareil photo</Text>
          <Text style={styles.textePerm}>
            ConsentIA a besoin de votre appareil photo pour scanner vos documents.
            Aucune photo n'est conservée après l'analyse.
          </Text>
          <TouchableOpacity style={styles.boutonOr} onPress={demanderPermission} activeOpacity={0.85}>
            <Text style={styles.boutonOrTexte}>Autoriser</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Capture d'une page (bloquée pendant la préparation) ---
  const capturer = async () => {
    if (preparation) return;
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) setPages((p) => [...p, photo.uri]);
  };

  const supprimerPage = (index: number) => {
    if (preparation) return;
    setPages((p) => p.filter((_, i) => i !== index));
  };

  // --- Préparation puis départ vers l'analyse ---
  const analyser = async () => {
    if (pages.length === 0 || preparation) return;
    setPreparation(true); // verrouille l'écran : plus aucune capture possible

    try {
      const images = await Promise.all(
        pages.map((uri) => FileSystem.readAsStringAsync(uri, { encoding: "base64" }))
      );

      setPages([]); // les photos ne sont pas conservées
      router.push({ pathname: "/analyse", params: { images: JSON.stringify(images) } });
    } catch {
      Alert.alert("Impossible de préparer le document", "Réessayez dans un instant.");
    } finally {
      setPreparation(false);
    }
  };

  return (
    <View style={styles.ecran}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={styles.calque} edges={["top"]} pointerEvents="box-none">
        <View style={styles.bandeau}>
          <Text style={styles.bandeauTexte}>
            {preparation ? "Préparation du document…" : "Cadrez le document"}
          </Text>
        </View>

        <View style={styles.cadre} pointerEvents="none">
          <View style={[styles.coin, styles.coinHG]} />
          <View style={[styles.coin, styles.coinHD]} />
          <View style={[styles.coin, styles.coinBG]} />
          <View style={[styles.coin, styles.coinBD]} />
        </View>

        {pages.length > 0 && (
          <View style={styles.miniatures}>
            {pages.map((uri, i) => (
              <View key={uri} style={styles.miniature}>
                <Image source={{ uri }} style={styles.miniatureImg} />
                <Text style={styles.miniatureNum}>{i + 1}</Text>
                {!preparation && (
                  <TouchableOpacity style={styles.miniatureX} onPress={() => supprimerPage(i)}>
                    <Feather name="x" size={11} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.commandes}>
          <View style={styles.cote} />

          <TouchableOpacity
            style={[styles.declencheur, preparation && styles.declencheurInactif]}
            onPress={capturer}
            disabled={preparation}
            activeOpacity={0.8}
          >
            <View style={styles.declencheurNoyau} />
          </TouchableOpacity>

          {pages.length > 0 || preparation ? (
            <TouchableOpacity
              style={styles.coteActif}
              onPress={analyser}
              disabled={preparation}
              activeOpacity={0.8}
            >
              {preparation ? (
                <ActivityIndicator color={Couleurs.texteSurOr} />
              ) : (
                <>
                  <Feather name="arrow-right" size={22} color={Couleurs.texteSurOr} />
                  <Text style={styles.coteActifTexte}>Analyser</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.cote} />
          )}
        </View>
      </SafeAreaView>

      {/* Voile de verrouillage pendant la préparation */}
      {preparation && <View style={styles.voile} pointerEvents="auto" />}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: "#000" },
  calque: { flex: 1, justifyContent: "space-between" },

  voile: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(5,15,28,0.35)",
  },

  bandeau: { alignItems: "center", marginTop: Espacements.md },
  bandeauTexte: {
    color: "#fff", fontSize: 13, fontWeight: Typo.moyen,
    backgroundColor: "rgba(0,0,0,0.45)", paddingVertical: 9, paddingHorizontal: 16, borderRadius: Rayons.rond,
  },

  cadre: { position: "absolute", top: "14%", left: "8%", right: "8%", bottom: "26%" },
  coin: { position: "absolute", width: 34, height: 34, borderColor: Couleurs.or, borderWidth: 3 },
  coinHG: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  coinHD: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  coinBG: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  coinBD: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },

  miniatures: { flexDirection: "row", gap: 10, paddingHorizontal: Espacements.lg, marginBottom: 12 },
  miniature: { width: 52, height: 68, borderRadius: 8, overflow: "hidden", borderWidth: 1.5, borderColor: Couleurs.or },
  miniatureImg: { width: "100%", height: "100%" },
  miniatureNum: {
    position: "absolute", bottom: 2, left: 4, color: "#fff", fontSize: 10, fontWeight: Typo.gras,
    textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 3,
  },
  miniatureX: {
    position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 5,
    backgroundColor: Couleurs.danger, alignItems: "center", justifyContent: "center",
  },

  commandes: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Espacements.xl, paddingBottom: Espacements.xl,
  },
  cote: { width: 74 },
  coteActif: {
    width: 74, height: 52, borderRadius: Rayons.md, backgroundColor: Couleurs.or,
    alignItems: "center", justifyContent: "center", gap: 1,
  },
  coteActifTexte: { color: Couleurs.texteSurOr, fontSize: 10, fontWeight: Typo.semiGras },
  declencheur: {
    width: 74, height: 74, borderRadius: Rayons.rond, backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  declencheurInactif: { opacity: 0.35 },
  declencheurNoyau: { width: 58, height: 58, borderRadius: Rayons.rond, backgroundColor: Couleurs.orSombre },

  // Écran de permission
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: Espacements.xl },
  pastille: {
    width: 72, height: 72, borderRadius: Rayons.lg, backgroundColor: Couleurs.orTransparent,
    borderWidth: 1, borderColor: "rgba(227,190,106,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: Espacements.lg,
  },
  titrePerm: { color: Couleurs.texte, fontSize: Typo.titreM, fontWeight: Typo.semiGras, marginBottom: 10 },
  textePerm: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit, textAlign: "center", lineHeight: 21, marginBottom: Espacements.lg },
  boutonOr: { backgroundColor: Couleurs.orSombre, paddingVertical: 15, paddingHorizontal: 40, borderRadius: Rayons.md },
  boutonOrTexte: { color: Couleurs.texteSurOr, fontSize: Typo.corps, fontWeight: Typo.gras },
});