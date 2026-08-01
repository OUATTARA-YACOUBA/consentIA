import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import { validerEmail } from "../../lib/validation";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const seConnecter = async () => {
    if (chargement) return;
    setErreur("");

    const erreurEmail = validerEmail(email);
    if (erreurEmail) return setErreur(erreurEmail);
    if (!motDePasse) return setErreur("Renseignez votre mot de passe.");

    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: motDePasse,
    });
    setChargement(false);

    if (error) {
      setErreur("Email ou mot de passe incorrect.");
    }
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.marqueZone}>
            <View style={styles.logo}>
              <Feather name="shield" size={28} color={Couleurs.or} />
            </View>
            <Text style={styles.marque}>
              Consent<Text style={styles.marqueOr}>IA</Text>
            </Text>
          </View>

          <Text style={styles.titre}>Bon retour</Text>
          <Text style={styles.sousTitre}>Connectez-vous pour retrouver vos analyses.</Text>

          <View style={styles.champ}>
            <Text style={styles.label}>Adresse email</Text>
            <View style={styles.saisie}>
              <Feather name="mail" size={18} color={Couleurs.texteSecondaire} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                placeholderTextColor={Couleurs.texteTernaire}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.champ}>
            <View style={styles.labelLigne}>
              <Text style={styles.label}>Mot de passe</Text>
              <TouchableOpacity
                style={styles.afficher}
                onPress={() => setVisible((v) => !v)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Feather name={visible ? "eye-off" : "eye"} size={14} color={Couleurs.or} />
                <Text style={styles.afficherTexte}>{visible ? "Masquer" : "Afficher"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.saisie}>
              <Feather name="lock" size={18} color={Couleurs.texteSecondaire} />
              <TextInput
                style={styles.input}
                value={motDePasse}
                onChangeText={setMotDePasse}
                placeholder="Votre mot de passe"
                placeholderTextColor={Couleurs.texteTernaire}
                secureTextEntry={!visible}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={seConnecter}
              />
            </View>
          </View>

          {erreur ? (
            <View style={styles.erreur}>
              <Feather name="alert-circle" size={15} color={Couleurs.danger} />
              <Text style={styles.erreurTexte}>{erreur}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.bouton, chargement && styles.boutonInactif]}
            onPress={seConnecter}
            disabled={chargement}
            activeOpacity={0.85}
          >
            {chargement ? (
              <ActivityIndicator color={Couleurs.texteSurOr} />
            ) : (
              <Text style={styles.boutonTexte}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.lien} onPress={() => router.push("/(auth)/inscription")} activeOpacity={0.7}>
            <Text style={styles.lienTexte}>
              Pas encore de compte ? <Text style={styles.lienOr}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { padding: Espacements.lg, paddingTop: Espacements.xl, paddingBottom: Espacements.xxl * 2, flexGrow: 1 },

  marqueZone: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: Espacements.xxl },
  logo: {
    width: 48, height: 48, borderRadius: Rayons.md,
    backgroundColor: Couleurs.orTransparent, borderWidth: 1, borderColor: "rgba(227,190,106,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  marque: { color: Couleurs.texte, fontSize: 22, fontWeight: Typo.gras },
  marqueOr: { color: Couleurs.or },

  titre: { color: Couleurs.texte, fontSize: Typo.titreXL, fontWeight: Typo.semiGras, marginBottom: 8 },
  sousTitre: { color: Couleurs.texteSecondaire, fontSize: Typo.corps, lineHeight: 21, marginBottom: Espacements.xl },

  champ: { marginBottom: Espacements.md },
  labelLigne: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  label: { color: Couleurs.texteSecondaire, fontSize: Typo.legende, fontWeight: Typo.moyen, marginBottom: 8 },
  afficher: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  afficherTexte: { color: Couleurs.or, fontSize: 12, fontWeight: Typo.semiGras },
  saisie: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.bordure,
    borderRadius: Rayons.md, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 15 : 4,
  },
  input: { flex: 1, color: Couleurs.texte, fontSize: Typo.corps, paddingVertical: 12 },

  erreur: {
    flexDirection: "row", alignItems: "center", gap: 9,
    backgroundColor: Couleurs.dangerFond, borderRadius: Rayons.sm,
    padding: 12, marginBottom: Espacements.sm,
  },
  erreurTexte: { flex: 1, color: Couleurs.danger, fontSize: Typo.corpsPetit, lineHeight: 18 },

  bouton: {
    backgroundColor: Couleurs.orSombre, borderRadius: Rayons.md,
    paddingVertical: 17, alignItems: "center", marginTop: Espacements.sm,
  },
  boutonInactif: { opacity: 0.6 },
  boutonTexte: { color: Couleurs.texteSurOr, fontSize: Typo.corps, fontWeight: Typo.gras },

  lien: { marginTop: Espacements.lg, alignItems: "center" },
  lienTexte: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit },
  lienOr: { color: Couleurs.or, fontWeight: Typo.semiGras },
});