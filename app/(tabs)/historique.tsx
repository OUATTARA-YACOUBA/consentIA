import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

type Ligne = {
  id: string;
  type_document: string | null;
  verdict: string | null;
  score: number | null;
  conseil_global: string | null;
  clauses: any;
  cree_le: string;
};

export default function Historique() {
  const router = useRouter();
  const { session } = useAuth();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("analyses")
      .select("id, type_document, verdict, score, conseil_global, clauses, cree_le")
      .order("cree_le", { ascending: false });

    if (!error && data) setLignes(data as Ligne[]);
    setChargement(false);
    setRafraichit(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const ouvrir = (l: Ligne) => {
    const contenu = {
      type_document: l.type_document,
      verdict: l.verdict,
      score: l.score,
      conseil_global: l.conseil_global,
      clauses: l.clauses ?? [],
    };
    router.push({
      pathname: "/resultat",
      params: { data: JSON.stringify(contenu), archive: "1" },
    });
  };

  const supprimer = (l: Ligne) => {
    Alert.alert(
      "Supprimer cette analyse",
      "Ce compte-rendu sera définitivement effacé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("analyses").delete().eq("id", l.id);
            if (error) {
              Alert.alert("Suppression impossible", "Réessayez dans un instant.");
              return;
            }
            setLignes((actuelles) => actuelles.filter((x) => x.id !== l.id));
          },
        },
      ]
    );
  };

  const formaterDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  if (chargement) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <Text style={styles.titrePage}>Historique</Text>
        <View style={styles.centre}>
          <ActivityIndicator color={Couleurs.or} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <Text style={styles.titrePage}>Historique</Text>

      {lignes.length === 0 ? (
        <View style={styles.centre}>
          <View style={styles.pastilleVide}>
            <Feather name="clock" size={30} color={Couleurs.or} />
          </View>
          <Text style={styles.titreVide}>Aucune analyse</Text>
          <Text style={styles.texteVide}>
            Vos comptes-rendus apparaîtront ici après votre première analyse.
          </Text>
          <TouchableOpacity
            style={styles.boutonOr}
            onPress={() => router.push("/(tabs)/scanner")}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonOrTexte}>Scanner un document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lignes}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={rafraichit}
              onRefresh={() => { setRafraichit(true); charger(); }}
              tintColor={Couleurs.or}
            />
          }
          ListHeaderComponent={
            <Text style={styles.compteur}>
              {lignes.length} analyse{lignes.length > 1 ? "s" : ""} conservée{lignes.length > 1 ? "s" : ""}
            </Text>
          }
          ListFooterComponent={
            <View style={styles.rassurance}>
              <Feather name="lock" size={13} color={Couleurs.conforme} />
              <Text style={styles.rassuranceTexte}>
                Seuls les comptes-rendus sont conservés. Vos documents ont été effacés
                dès la fin de chaque analyse.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const score = item.score ?? 50;
            const couleur =
              score < 40 ? Couleurs.danger : score < 70 ? Couleurs.attention : Couleurs.conforme;
            const nbDanger = Array.isArray(item.clauses)
              ? item.clauses.filter((c: any) => c.statut === "rouge").length
              : 0;

            return (
              <TouchableOpacity
                style={styles.carte}
                onPress={() => ouvrir(item)}
                onLongPress={() => supprimer(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.pastilleScore, { backgroundColor: couleur + "22", borderColor: couleur + "55" }]}>
                  <Text style={[styles.scoreTexte, { color: couleur }]}>{score}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.carteType} numberOfLines={1}>
                    {item.type_document ?? "Document analysé"}
                  </Text>
                  <Text style={[styles.carteVerdict, { color: couleur }]}>{item.verdict}</Text>
                  <View style={styles.carteBas}>
                    <Text style={styles.carteDate}>{formaterDate(item.cree_le)}</Text>
                    {nbDanger > 0 && (
                      <View style={styles.badgeDanger}>
                        <Feather name="alert-triangle" size={9} color={Couleurs.danger} />
                        <Text style={styles.badgeDangerTexte}>
                          {nbDanger} danger{nbDanger > 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.supprimer}
                  onPress={() => supprimer(item)}
                  hitSlop={10}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={17} color={Couleurs.texteTernaire} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  titrePage: {
    color: Couleurs.texte,
    fontSize: Typo.titreL,
    fontWeight: Typo.semiGras,
    paddingHorizontal: Espacements.lg,
    paddingTop: Espacements.sm,
    paddingBottom: Espacements.md,
  },

  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: Espacements.xl },
  pastilleVide: {
    width: 72,
    height: 72,
    borderRadius: Rayons.lg,
    backgroundColor: Couleurs.orTransparent,
    borderWidth: 1,
    borderColor: "rgba(227,190,106,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Espacements.lg,
  },
  titreVide: {
    color: Couleurs.texte,
    fontSize: Typo.titreM,
    fontWeight: Typo.semiGras,
    marginBottom: 8,
  },
  texteVide: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.corps,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  boutonOr: {
    backgroundColor: Couleurs.orSombre,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: Rayons.md,
    marginTop: Espacements.xl,
  },
  boutonOrTexte: {
    color: Couleurs.texteSurOr,
    fontSize: Typo.corps,
    fontWeight: Typo.gras,
  },

  liste: { paddingHorizontal: Espacements.lg, paddingBottom: Espacements.xxl },
  compteur: { color: Couleurs.texteTernaire, fontSize: Typo.legende, marginBottom: 12 },

  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Couleurs.fondCarte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: Rayons.md,
    padding: Espacements.md,
    marginBottom: 10,
  },
  pastilleScore: {
    width: 48,
    height: 48,
    borderRadius: Rayons.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreTexte: { fontSize: 18, fontWeight: Typo.gras },
  carteType: {
    color: Couleurs.texte,
    fontSize: Typo.corpsPetit,
    fontWeight: Typo.semiGras,
  },
  carteVerdict: {
    fontSize: Typo.legende,
    fontWeight: Typo.moyen,
    marginTop: 2,
  },
  carteBas: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 5 },
  carteDate: { color: Couleurs.texteTernaire, fontSize: 11 },
  badgeDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Couleurs.dangerFond,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Rayons.rond,
  },
  badgeDangerTexte: {
    color: Couleurs.danger,
    fontSize: 10,
    fontWeight: Typo.semiGras,
  },
  supprimer: { padding: 6 },

  rassurance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Espacements.md,
    padding: 12,
    backgroundColor: Couleurs.conformeFond,
    borderRadius: Rayons.md,
  },
  rassuranceTexte: {
    flex: 1,
    color: Couleurs.texteSecondaire,
    fontSize: 11.5,
    lineHeight: 16,
  },
});