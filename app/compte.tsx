import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function Compte() {
  const router = useRouter();
  const { session } = useAuth();

  const nomInitial = (session?.user?.user_metadata?.nom_complet as string) ?? "";
  const emailInitial = session?.user?.email ?? "";

  const [nom, setNom] = useState(nomInitial);
  const [email, setEmail] = useState(emailInitial);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState<null | "identite" | "email" | "motDePasse">(null);

  // --- Nom ---
  const enregistrerNom = async () => {
    const valeur = nom.trim();
    if (!valeur) return Alert.alert("Nom requis", "Renseignez votre nom.");
    if (valeur === nomInitial) return;

    setEnCours("identite");
    const { error } = await supabase.auth.updateUser({ data: { nom_complet: valeur } });
    if (!error && session?.user?.id) {
      await supabase.from("profils").update({ nom_complet: valeur }).eq("id", session.user.id);
    }
    setEnCours(null);

    if (error) Alert.alert("Modification impossible", "Réessayez dans un instant.");
    else Alert.alert("Nom modifié", "Votre nom a été mis à jour.");
  };

  // --- Email ---
  const enregistrerEmail = async () => {
    const valeur = email.trim().toLowerCase();
    if (!valeur) return Alert.alert("Email requis", "Renseignez une adresse email.");
    if (valeur === emailInitial) return;

    setEnCours("email");
    const { error } = await supabase.auth.updateUser({ email: valeur });
    setEnCours(null);

    if (error) {
      Alert.alert(
        "Modification impossible",
        error.message.includes("already")
          ? "Cette adresse est déjà utilisée."
          : "Réessayez dans un instant."
      );
      return;
    }
    Alert.alert(
      "Vérification requise",
      "Un message de confirmation a été envoyé à votre nouvelle adresse. Le changement prendra effet une fois confirmé."
    );
  };

  // --- Mot de passe ---
  const enregistrerMotDePasse = async () => {
    if (motDePasse.length < 6) {
      return Alert.alert("Mot de passe trop court", "Il doit contenir au moins 6 caractères.");
    }
    if (motDePasse !== confirmation) {
      return Alert.alert("Les mots de passe diffèrent", "Saisissez deux fois le même mot de passe.");
    }

    setEnCours("motDePasse");
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnCours(null);

    if (error) {
      Alert.alert("Modification impossible", "Réessayez dans un instant.");
      return;
    }
    setMotDePasse("");
    setConfirmation("");
    Alert.alert("Mot de passe modifié", "Votre nouveau mot de passe est actif.");
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.entete}>
          <TouchableOpacity style={styles.retour} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color={Couleurs.texte} />
          </TouchableOpacity>
          <Text style={styles.enteteTitre}>Mes informations</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">

          <Text style={styles.introduction}>
            Vous pouvez consulter et corriger à tout moment les informations vous concernant,
            conformément aux articles 29 et 31 de la loi n°2013-450.
          </Text>

          {/* Nom */}
          <Text style={styles.section}>IDENTITÉ</Text>
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
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bouton, (enCours !== null || nom.trim() === nomInitial) && styles.boutonInactif]}
            onPress={enregistrerNom}
            disabled={enCours !== null || nom.trim() === nomInitial}
            activeOpacity={0.85}
          >
            {enCours === "identite" ? (
              <ActivityIndicator color={Couleurs.texteSurOr} size="small" />
            ) : (
              <Text style={styles.boutonTexte}>Enregistrer le nom</Text>
            )}
          </TouchableOpacity>

          {/* Email */}
          <Text style={styles.section}>ADRESSE EMAIL</Text>
          <View style={styles.champ}>
            <Text style={styles.label}>Email de connexion</Text>
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
              />
            </View>
          </View>
          <Text style={styles.aide}>
            Un changement d'adresse doit être confirmé depuis la nouvelle boîte mail.
          </Text>
          <TouchableOpacity
            style={[styles.bouton, (enCours !== null || email.trim().toLowerCase() === emailInitial) && styles.boutonInactif]}
            onPress={enregistrerEmail}
            disabled={enCours !== null || email.trim().toLowerCase() === emailInitial}
            activeOpacity={0.85}
          >
            {enCours === "email" ? (
              <ActivityIndicator color={Couleurs.texteSurOr} size="small" />
            ) : (
              <Text style={styles.boutonTexte}>Modifier l'adresse</Text>
            )}
          </TouchableOpacity>

          {/* Mot de passe */}
          <Text style={styles.section}>MOT DE PASSE</Text>
          <View style={styles.champ}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <View style={styles.saisie}>
              <Feather name="lock" size={18} color={Couleurs.texteSecondaire} />
              <TextInput
                style={styles.input}
                value={motDePasse}
                onChangeText={setMotDePasse}
                placeholder="Au moins 6 caractères"
                placeholderTextColor={Couleurs.texteTernaire}
                secureTextEntry={!visible}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setVisible((v) => !v)} activeOpacity={0.7}>
                <Feather name={visible ? "eye-off" : "eye"} size={18} color={Couleurs.texteSecondaire} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.champ}>
            <Text style={styles.label}>Confirmation</Text>
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
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bouton, (enCours !== null || !motDePasse) && styles.boutonInactif]}
            onPress={enregistrerMotDePasse}
            disabled={enCours !== null || !motDePasse}
            activeOpacity={0.85}
          >
            {enCours === "motDePasse" ? (
              <ActivityIndicator color={Couleurs.texteSurOr} size="small" />
            ) : (
              <Text style={styles.boutonTexte}>Modifier le mot de passe</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xxl },

  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Espacements.lg,
    paddingVertical: Espacements.sm,
  },
  retour: {
    width: 40,
    height: 40,
    borderRadius: Rayons.md,
    backgroundColor: Couleurs.fondCarte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    alignItems: "center",
    justifyContent: "center",
  },
  enteteTitre: { color: Couleurs.texte, fontSize: Typo.titreS, fontWeight: Typo.semiGras },

  introduction: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.corpsPetit,
    lineHeight: 20,
    marginBottom: Espacements.sm,
  },

  section: {
    color: Couleurs.texteTernaire,
    fontSize: Typo.legende,
    fontWeight: Typo.semiGras,
    letterSpacing: 1.2,
    marginTop: Espacements.xl,
    marginBottom: 12,
  },

  champ: { marginBottom: Espacements.md },
  label: {
    color: Couleurs.texteSecondaire,
    fontSize: Typo.legende,
    fontWeight: Typo.moyen,
    marginBottom: 8,
  },
  saisie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Couleurs.fondCarte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: Rayons.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 15 : 4,
  },
  input: {
    flex: 1,
    color: Couleurs.texte,
    fontSize: Typo.corps,
    paddingVertical: 12,
  },
  aide: {
    color: Couleurs.texteTernaire,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: -6,
    marginBottom: 12,
  },

  bouton: {
    backgroundColor: Couleurs.orSombre,
    borderRadius: Rayons.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  boutonInactif: { opacity: 0.4 },
  boutonTexte: {
    color: Couleurs.texteSurOr,
    fontSize: Typo.corpsPetit,
    fontWeight: Typo.gras,
  },
});