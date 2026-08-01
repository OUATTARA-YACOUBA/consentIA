import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export default function Profil() {
  const router = useRouter();
  const { session } = useAuth();
  const [nbAnalyses, setNbAnalyses] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<null | "deconnexion" | "historique" | "compte" | "export">(null);

  const email = session?.user?.email ?? "";
  const nom = (session?.user?.user_metadata?.nom_complet as string) ?? "Citoyen";
  const initiale = nom.charAt(0).toUpperCase();

  const compter = useCallback(async () => {
    if (!session?.user?.id) return;
    const { count } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true });
    setNbAnalyses(count ?? 0);
  }, [session]);

  useFocusEffect(useCallback(() => { compter(); }, [compter]));

  // --- Droit d'accès : export des informations du compte (sans le détail des analyses) ---
  const exporterDonnees = async () => {
    setEnCours("export");

    // On récupère juste le nombre d'analyses, pas leur contenu
    const { count } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true });

    setEnCours(null);

    const date = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    let texte = "MES DONNÉES CONSENTIA\n";
    texte += `Export du ${date}\n\n`;
    texte += "─────────────────────────\n";
    texte += "MON COMPTE\n";
    texte += "─────────────────────────\n";
    texte += `Nom : ${nom}\n`;
    texte += `Email : ${email}\n`;
    texte += `Compte créé le : ${new Date(session?.user?.created_at ?? "").toLocaleDateString("fr-FR")}\n`;
    texte += `Nombre d'analyses conservées : ${count ?? 0}\n\n`;

    texte += "─────────────────────────\n";
    texte += "Aucun de vos documents n'est conservé par ConsentIA.\n";
    texte += "Vos analyses restent consultables dans l'application,\n";
    texte += "dans l'onglet Historique.\n";

    try {
      await Share.share({ message: texte, title: "Mes données ConsentIA" });
    } catch {
      Alert.alert("Partage impossible", "Réessayez dans un instant.");
    }
  };

  // --- Déconnexion ---
  const seDeconnecter = () => {
    Alert.alert("Se déconnecter", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          setEnCours("deconnexion");
          await supabase.auth.signOut();
          setEnCours(null);
        },
      },
    ]);
  };

  // --- Effacer tout l'historique ---
  const effacerHistorique = () => {
    if (!nbAnalyses) {
      Alert.alert("Historique vide", "Vous n'avez aucune analyse à effacer.");
      return;
    }

    Alert.alert(
      "Effacer tout l'historique",
      `Vos ${nbAnalyses} compte${nbAnalyses > 1 ? "s" : ""}-rendu${nbAnalyses > 1 ? "s" : ""} seront définitivement supprimés. Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout effacer",
          style: "destructive",
          onPress: async () => {
            setEnCours("historique");
            const { error } = await supabase
              .from("analyses")
              .delete()
              .eq("utilisateur_id", session!.user.id);
            setEnCours(null);

            if (error) {
              Alert.alert("Suppression impossible", "Réessayez dans un instant.");
              return;
            }
            setNbAnalyses(0);
            Alert.alert("Historique effacé", "Tous vos comptes-rendus ont été supprimés.");
          },
        },
      ]
    );
  };

  // --- Supprimer le compte ---
  const supprimerCompte = () => {
    Alert.alert(
      "Supprimer votre compte",
      "Votre compte et l'ensemble de vos données seront définitivement effacés. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmer la suppression",
              "Dernière confirmation : voulez-vous vraiment supprimer votre compte ConsentIA ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer définitivement",
                  style: "destructive",
                  onPress: async () => {
                    setEnCours("compte");
                    const { data, error } = await supabase.functions.invoke("supprimer-compte");
                    setEnCours(null);

                    if (error || data?.erreur) {
                      Alert.alert(
                        "Suppression impossible",
                        data?.erreur ?? "Réessayez dans un instant."
                      );
                      return;
                    }
                    await supabase.auth.signOut();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>

        <Text style={styles.titrePage}>Profil</Text>

        <View style={styles.carteCompte}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexte}>{initiale}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nom}>{nom}</Text>
            <Text style={styles.email}>{email}</Text>
            {nbAnalyses !== null && (
              <Text style={styles.compteur}>
                {nbAnalyses} analyse{nbAnalyses > 1 ? "s" : ""} conservée{nbAnalyses > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.section}>VOS GARANTIES</Text>

        <View style={styles.carteInfo}>
          <View style={styles.ligneInfo}>
            <View style={styles.iconeInfo}>
              <Feather name="lock" size={17} color={Couleurs.conforme} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitre}>Vos documents ne sont pas conservés</Text>
              <Text style={styles.infoTexte}>
                Chaque document est analysé puis effacé immédiatement. Seul le compte-rendu
                reste dans votre historique.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.carteInfo}>
          <View style={styles.ligneInfo}>
            <View style={styles.iconeInfo}>
              <Feather name="shield" size={17} color={Couleurs.or} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitre}>Conforme à la loi ivoirienne</Text>
              <Text style={styles.infoTexte}>
                ConsentIA respecte la loi n°2013-450 relative à la protection des données
                à caractère personnel.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>VOS DROITS</Text>

        <TouchableOpacity
          style={styles.action}
          onPress={() => router.push("/compte")}
          disabled={enCours !== null}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcone}>
            <Feather name="edit-3" size={17} color={Couleurs.or} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Consulter et corriger mes informations</Text>
            <Text style={styles.actionTexte}>Nom, adresse email, mot de passe</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Couleurs.texteTernaire} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={exporterDonnees}
          disabled={enCours !== null}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcone}>
            {enCours === "export" ? (
              <ActivityIndicator color={Couleurs.or} size="small" />
            ) : (
              <Feather name="download" size={17} color={Couleurs.or} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Obtenir mes informations</Text>
            <Text style={styles.actionTexte}>Récapitulatif des données de votre compte</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Couleurs.texteTernaire} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={effacerHistorique}
          disabled={enCours !== null}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcone}>
            {enCours === "historique" ? (
              <ActivityIndicator color={Couleurs.attention} size="small" />
            ) : (
              <Feather name="trash-2" size={17} color={Couleurs.attention} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Effacer tout mon historique</Text>
            <Text style={styles.actionTexte}>Supprime tous vos comptes-rendus d'analyse</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Couleurs.texteTernaire} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={supprimerCompte}
          disabled={enCours !== null}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcone}>
            {enCours === "compte" ? (
              <ActivityIndicator color={Couleurs.danger} size="small" />
            ) : (
              <Feather name="user-x" size={17} color={Couleurs.danger} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Supprimer mon compte</Text>
            <Text style={styles.actionTexte}>Efface définitivement votre compte et vos données</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Couleurs.texteTernaire} />
        </TouchableOpacity>

        <Text style={styles.mentionDroits}>
          Conformément à la loi n°2013-450, vous disposez d'un droit d'accès (art. 29),
          de rectification (art. 31), d'opposition et d'effacement de vos données personnelles.
          ConsentIA ne traite que les documents que vous soumettez vous-même.
        </Text>

        <Text style={styles.section}>COMPTE</Text>

        <TouchableOpacity
          style={styles.boutonDeconnexion}
          onPress={seDeconnecter}
          disabled={enCours !== null}
          activeOpacity={0.8}
        >
          {enCours === "deconnexion" ? (
            <ActivityIndicator color={Couleurs.texteSecondaire} size="small" />
          ) : (
            <>
              <Feather name="log-out" size={18} color={Couleurs.texteSecondaire} />
              <Text style={styles.deconnexionTexte}>Se déconnecter</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>ConsentIA · version 1.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xxl },

  titrePage: { color: Couleurs.texte, fontSize: Typo.titreL, fontWeight: Typo.semiGras, marginBottom: Espacements.lg },

  carteCompte: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.fondCarteBordure,
    borderRadius: Rayons.lg, padding: Espacements.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: Rayons.rond,
    backgroundColor: Couleurs.orSombre, alignItems: "center", justifyContent: "center",
  },
  avatarTexte: { color: Couleurs.texteSurOr, fontSize: 24, fontWeight: Typo.gras },
  nom: { color: Couleurs.texte, fontSize: Typo.titreS, fontWeight: Typo.semiGras },
  email: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit, marginTop: 3 },
  compteur: { color: Couleurs.texteTernaire, fontSize: 11.5, marginTop: 5 },

  section: {
    color: Couleurs.texteTernaire, fontSize: Typo.legende, fontWeight: Typo.semiGras,
    letterSpacing: 1.2, marginTop: Espacements.xl, marginBottom: 12,
  },

  carteInfo: {
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: Couleurs.bordure,
    borderRadius: Rayons.md, padding: Espacements.md, marginBottom: 10,
  },
  ligneInfo: { flexDirection: "row", gap: 14 },
  iconeInfo: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  infoTitre: { color: Couleurs.texte, fontSize: Typo.corpsPetit, fontWeight: Typo.semiGras, marginBottom: 4 },
  infoTexte: { color: Couleurs.texteSecondaire, fontSize: Typo.legende, lineHeight: 18 },

  action: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: Couleurs.bordure,
    borderRadius: Rayons.md, padding: Espacements.md, marginBottom: 10,
  },
  actionIcone: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  actionTitre: { color: Couleurs.texte, fontSize: Typo.corpsPetit, fontWeight: Typo.semiGras },
  actionTexte: { color: Couleurs.texteSecondaire, fontSize: 11.5, marginTop: 2 },

  mentionDroits: { color: Couleurs.texteTernaire, fontSize: 11.5, lineHeight: 17, marginTop: 6 },

  boutonDeconnexion: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.bordure,
    borderRadius: Rayons.md, paddingVertical: 16,
  },
  deconnexionTexte: { color: Couleurs.texteSecondaire, fontSize: Typo.corps, fontWeight: Typo.semiGras },

  version: { color: Couleurs.texteTernaire, fontSize: Typo.legende, textAlign: "center", marginTop: Espacements.xl },
});