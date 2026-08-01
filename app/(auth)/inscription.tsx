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
import { forceMotDePasse, validerEmail, validerMotDePasse, validerNom } from "../../lib/validation";

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const force = forceMotDePasse(motDePasse);
  const libelleForce = ["Très faible", "Faible", "Moyen", "Bon", "Fort"][force];
  const couleurForce = [Couleurs.danger, Couleurs.danger, Couleurs.attention, Couleurs.conforme, Couleurs.conforme][force];

  const sInscrire = async () => {
    if (chargement) return;
    setErreur("");

    const erreurNom = validerNom(nom);
    if (erreurNom) return setErreur(erreurNom);

    const erreurEmail = validerEmail(email);
    if (erreurEmail) return setErreur(erreurEmail);

    const erreurMdp = validerMotDePasse(motDePasse);
    if (erreurMdp) return setErreur(erreurMdp);

    if (motDePasse !== confirmation) {
      return setErreur("Les deux mots de passe ne correspondent pas.");
    }

    setChargement(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: motDePasse,
      options: { data: { nom_complet: nom.trim() } },
    });
    setChargement(false);

    if (error) {
      setErreur(
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cette adresse."
          : "Création impossible. Réessayez dans un instant."
      );
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

          <TouchableOpacity style={styles.retour} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color={Couleurs.texte} />
          </TouchableOpacity>

          <Text style={styles.titre}>Créer votre compte</Text>
          <Text style={styles.sousTitre}>
            Rejoignez ConsentIA et protégez vos droits à chaque signature.
          </Text>

          <View style={styles.champ}>
            <Text style={styles.label}>Nom complet</Text>
            <View style={styles.saisie}>
              <Feather name="user" size={18} color={Couleurs.texteSecondaire} />
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Votre nom"
                placeholderTextColor={Couleurs.texteTernaire}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

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
                placeholder="8 caractères, maj., min., chiffre, symbole"
                placeholderTextColor={Couleurs.texteTernaire}
                secureTextEntry={!visible}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {motDePasse.length > 0 && (
              <View style={styles.forceZone}>
                <View style={styles.forceBarres}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.forceBarre,
                        { backgroundColor: i < force ? couleurForce : "rgba(255,255,255,0.12)" },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.forceTexte, { color: couleurForce }]}>{libelleForce}</Text>
              </View>
            )}
          </View>

          <View style={styles.champ}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.saisie}>
              <Feather name="lock" size={18} color={Couleurs.texteSecondaire} />
              <TextInput
                style={styles.input}
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder="Répétez le mot de passe"
                placeholderTextColor={Couleurs.texteTernaire}
                secureTextEntry={!visible}
                autoCapitalize="none"
                returnKeyType="done"
              />
              {confirmation.length > 0 && (
                <Feather
                  name={confirmation === motDePasse ? "check-circle" : "x-circle"}
                  size={18}
                  color={confirmation === motDePasse ? Couleurs.conforme : Couleurs.danger}
                />
              )}
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
            onPress={sInscrire}
            disabled={chargement}
            activeOpacity={0.85}
          >
            {chargement ? (
              <ActivityIndicator color={Couleurs.texteSurOr} />
            ) : (
              <Text style={styles.boutonTexte}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.mention}>
            Vos documents ne sont jamais conservés. Seuls les comptes-rendus d'analyse
            sont enregistrés dans votre historique.
          </Text>

          <TouchableOpacity style={styles.lien} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.lienTexte}>
              Vous avez déjà un compte ? <Text style={styles.lienOr}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xxl * 2, flexGrow: 1 },

  retour: {
    width: 40, height: 40, borderRadius: Rayons.md,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.bordure,
    alignItems: "center", justifyContent: "center", marginBottom: Espacements.xl,
  },

  titre: { color: Couleurs.texte, fontSize: Typo.titreL, fontWeight: Typo.semiGras, marginBottom: 8 },
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

  forceZone: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  forceBarres: { flexDirection: "row", gap: 5, flex: 1 },
  forceBarre: { flex: 1, height: 4, borderRadius: 2 },
  forceTexte: { fontSize: 11.5, fontWeight: Typo.semiGras, minWidth: 62, textAlign: "right" },

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

  mention: {
    color: Couleurs.texteTernaire, fontSize: Typo.legende, lineHeight: 17,
    textAlign: "center", marginTop: Espacements.md,
  },

  lien: { marginTop: Espacements.lg, alignItems: "center" },
  lienTexte: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit },
  lienOr: { color: Couleurs.or, fontWeight: Typo.semiGras },
});