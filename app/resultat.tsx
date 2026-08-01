import { Feather } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, Espacements, Rayons, Typo } from "../constants/theme";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

type Clause = {
  statut: "rouge" | "jaune" | "vert";
  extrait: string;
  analyse: string;
  article: string;
  reco: string;
};

export default function Resultat() {
  const { data, erreur, archive } = useLocalSearchParams<{
    data?: string;
    erreur?: string;
    archive?: string;
  }>();
  const router = useRouter();
  const { session } = useAuth();
  const [alerteVisible, setAlerteVisible] = useState(false);
  const [lectureEnCours, setLectureEnCours] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const dejaEnregistre = useRef(false);

  const lecteur = useAudioPlayer(require("../assets/alerte.mp3"));

  const consultationArchive = archive === "1";

  let r: any = null;
  try { r = data ? JSON.parse(data) : null; } catch { r = null; }

  const clauses: Clause[] = r?.clauses ?? [];
  const nbDanger = clauses.filter((c) => c.statut === "rouge").length;

  // Enregistrement du compte-rendu (jamais le document)
  useEffect(() => {
    if (consultationArchive || dejaEnregistre.current) return;
    if (!r || erreur || r.hors_perimetre || !session?.user?.id) return;

    dejaEnregistre.current = true;

    supabase
      .from("analyses")
      .insert({
        utilisateur_id: session.user.id,
        type_document: r.type_document ?? null,
        verdict: r.verdict ?? null,
        score: r.score ?? null,
        conseil_global: r.conseil_global ?? null,
        clauses: r.clauses ?? [],
      })
      .then(({ error }) => {
        if (error) console.log(">>> Enregistrement historique:", error.message);
      });
  }, [session]);

  // Alerte pour les clauses dangereuses
  useEffect(() => {
    if (consultationArchive) return;
    if (nbDanger > 0 && !erreur && !r?.hors_perimetre) {
      setAlerteVisible(true);
      Vibration.vibrate([0, 600, 400], true);
      try {
        lecteur.loop = true;
        lecteur.play();
      } catch {}
    }
    return () => {
      Vibration.cancel();
      try { lecteur.pause(); } catch {}
    };
  }, [nbDanger]);

  // On coupe la lecture vocale quand on quitte l'écran
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const fermerAlerte = () => {
    setAlerteVisible(false);
    Vibration.cancel();
    try { lecteur.pause(); } catch {}
  };

  const retour = () => {
    fermerAlerte();
    Speech.stop();
    if (consultationArchive) router.back();
    else router.replace("/(tabs)");
  };

  // --- Lecture vocale : on construit une liste de segments courts ---
  const construireSegments = (): string[] => {
    const segments: string[] = [];
    segments.push(`Rapport d'analyse. Document : ${r.type_document ?? "document analysé"}.`);
    segments.push(`Verdict : ${r.verdict}. Score de protection : ${r.score ?? 50} sur 100.`);
    if (r.conseil_global) segments.push(`Notre conseil : ${r.conseil_global}`);

    const ordreLecture = { rouge: 0, jaune: 1, vert: 2 };
    const triees = [...clauses].sort((a, b) => (ordreLecture[a.statut] ?? 9) - (ordreLecture[b.statut] ?? 9));

    triees.forEach((c, i) => {
      const niveau = c.statut === "rouge" ? "Danger" : c.statut === "jaune" ? "Attention" : "Point conforme";
      let seg = `Point ${i + 1}, ${niveau}. ${c.analyse}`;
      if (c.reco) seg += ` Que faire : ${c.reco}`;
      // Sécurité : si un segment dépasse, on le coupe en deux
      if (seg.length > 3800) {
        segments.push(seg.slice(0, 3800));
        segments.push(seg.slice(3800));
      } else {
        segments.push(seg);
      }
    });
    return segments;
  };

  const basculerLecture = () => {
    if (lectureEnCours) {
      Speech.stop();
      setLectureEnCours(false);
      return;
    }

    const segments = construireSegments();
    setLectureEnCours(true);

    // Lecture enchaînée : chaque segment déclenche le suivant à la fin
    const lireSegment = (index: number) => {
      if (index >= segments.length) {
        setLectureEnCours(false);
        return;
      }
      Speech.speak(segments[index], {
        language: "fr-FR",
        rate: 0.95,
        onDone: () => lireSegment(index + 1),
        onStopped: () => setLectureEnCours(false),
        onError: () => setLectureEnCours(false),
      });
    };

    lireSegment(0);
  };

  // --- Génération du PDF ---
  const genererPdf = async () => {
    if (pdfEnCours) return;
    setPdfEnCours(true);
    Speech.stop();
    setLectureEnCours(false);

    try {
      const score = r.score ?? 50;
      const couleur = score < 40 ? "#E5564A" : score < 70 ? "#E0A73C" : "#4CAF82";
      const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      const ordrePdf = { rouge: 0, jaune: 1, vert: 2 };
      const triees = [...clauses].sort((a, b) => (ordrePdf[a.statut] ?? 9) - (ordrePdf[b.statut] ?? 9));

      const clausesHtml = triees.map((c) => {
        const conf = c.statut === "rouge"
          ? { coul: "#E5564A", fond: "#FBEAE8", lib: "DANGER" }
          : c.statut === "jaune"
          ? { coul: "#E0A73C", fond: "#FCF4E6", lib: "ATTENTION" }
          : { coul: "#4CAF82", fond: "#E9F6EF", lib: "CONFORME" };
        return `
          <div style="background:${conf.fond};border-left:4px solid ${conf.coul};border-radius:8px;padding:14px;margin-bottom:12px;">
            <span style="display:inline-block;background:${conf.coul};color:#fff;font-size:10px;font-weight:bold;padding:3px 9px;border-radius:20px;letter-spacing:0.5px;">${conf.lib}</span>
            <p style="font-style:italic;color:#555;font-size:12px;margin:10px 0;">« ${(c.extrait ?? "").replace(/</g, "&lt;")} »</p>
            <p style="color:#1a1a1a;font-size:13px;margin:8px 0;line-height:1.5;">${(c.analyse ?? "").replace(/</g, "&lt;")}</p>
            ${c.article ? `<p style="color:#666;font-size:11px;margin:6px 0;"><b>Réf. légale :</b> ${(c.article ?? "").replace(/</g, "&lt;")}</p>` : ""}
            ${c.reco ? `<div style="background:#fff;border-radius:6px;padding:9px;margin-top:8px;"><span style="color:#4CAF82;font-size:9px;font-weight:bold;">QUE FAIRE</span><p style="color:#1a1a1a;font-size:12px;margin:4px 0 0;line-height:1.5;">${(c.reco ?? "").replace(/</g, "&lt;")}</p></div>` : ""}
          </div>`;
      }).join("");

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #1a1a1a; }
          .entete { border-bottom: 3px solid #0A2138; padding-bottom: 16px; margin-bottom: 24px; }
          .marque { font-size: 26px; font-weight: 800; color: #0A2138; }
          .marque span { color: #C9A24A; }
          .date { color: #888; font-size: 12px; margin-top: 4px; }
          .verdict { background: #0A2138; border-radius: 12px; padding: 20px; color: #fff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .score { font-size: 44px; font-weight: 800; color: ${couleur}; }
          .conseil { background: #FCF7EA; border: 1px solid #E3BE6A; border-radius: 8px; padding: 14px; margin: 20px 0; }
          .conseil b { color: #9A6A1E; font-size: 10px; letter-spacing: 0.5px; }
          .pied { margin-top: 28px; padding-top: 16px; border-top: 1px solid #ddd; color: #888; font-size: 11px; line-height: 1.5; }
          h2 { font-size: 15px; color: #0A2138; margin: 24px 0 12px; }
        </style></head><body>
          <div class="entete">
            <div class="marque">Consent<span>IA</span></div>
            <div class="date">Rapport d'analyse — ${date}</div>
          </div>

          <div class="verdict">
            <div>
              <div style="font-size:13px;opacity:0.7;">${r.type_document ?? "Document analysé"}</div>
              <div style="font-size:22px;font-weight:700;color:${couleur};margin-top:4px;">${r.verdict ?? ""}</div>
            </div>
            <div style="text-align:right;">
              <div class="score">${score}</div>
              <div style="font-size:11px;opacity:0.6;">/ 100 · PROTECTION</div>
            </div>
          </div>
          <p style="text-align:center;color:#888;font-size:11px;font-style:italic;">Plus le score est élevé, plus vos droits sont protégés.</p>

          ${r.conseil_global ? `<div class="conseil"><b>NOTRE CONSEIL</b><p style="margin:6px 0 0;font-size:13px;line-height:1.5;">${r.conseil_global}</p></div>` : ""}

          <h2>Points examinés (${clauses.length})</h2>
          ${clausesHtml}

          <div class="pied">
            Ce rapport a été généré par ConsentIA au regard du droit applicable en Côte d'Ivoire.
            Il constitue une information et non un conseil juridique personnalisé.
            Aucun document n'est conservé : seul ce compte-rendu existe.
          </div>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Rapport ConsentIA" });
      }
    } catch (e) {
      console.log(">>> Erreur PDF:", e);
    } finally {
      setPdfEnCours(false);
    }
  };

  // ---------- Cas : erreur ----------
  if (erreur) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnTete onRetour={retour} />
        <View style={styles.centreMessage}>
          <View style={[styles.pastilleMsg, { backgroundColor: Couleurs.dangerFond }]}>
            <Feather name="alert-triangle" size={30} color={Couleurs.danger} />
          </View>
          <Text style={styles.titreMsg}>Analyse impossible</Text>
          <Text style={styles.texteMsg}>{erreur}</Text>
          <TouchableOpacity style={styles.boutonOr} onPress={retour} activeOpacity={0.85}>
            <Text style={styles.boutonOrTexte}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Cas : hors périmètre ----------
  if (r?.hors_perimetre) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnTete onRetour={retour} />
        <View style={styles.centreMessage}>
          <View style={[styles.pastilleMsg, { backgroundColor: Couleurs.orTransparent }]}>
            <Feather name="help-circle" size={30} color={Couleurs.or} />
          </View>
          <Text style={styles.titreMsg}>Rien à analyser ici</Text>
          <Text style={styles.texteMsg}>
            {r.message ??
              "ConsentIA analyse les documents qui touchent à vos droits ou à vos données personnelles. Ce document ne semble pas en faire partie."}
          </Text>
          {r.type_document ? (
            <Text style={styles.observe}>Document observé : {r.type_document}</Text>
          ) : null}
          <TouchableOpacity style={styles.boutonOr} onPress={retour} activeOpacity={0.85}>
            <Text style={styles.boutonOrTexte}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Cas : aucune donnée ----------
  if (!r) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnTete onRetour={retour} />
        <View style={styles.centreMessage}>
          <Text style={styles.texteMsg}>Aucune donnée reçue.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Cas normal ----------
  const score: number = r.score ?? 50;
  const couleurScore =
    score < 40 ? Couleurs.danger : score < 70 ? Couleurs.attention : Couleurs.conforme;
  const fondVerdict =
    score < 40 ? Couleurs.dangerFond : score < 70 ? Couleurs.attentionFond : Couleurs.conformeFond;

  const ordre = { rouge: 0, jaune: 1, vert: 2 };
  const triees = [...clauses].sort((a, b) => (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9));

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnTete onRetour={retour} />

      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>

        <View style={[styles.verdict, { backgroundColor: fondVerdict, borderColor: couleurScore + "55" }]}>
          <View style={styles.verdictHaut}>
            <View style={{ flex: 1 }}>
              <Text style={styles.verdictType}>{r.type_document ?? "Document analysé"}</Text>
              <Text style={[styles.verdictTexte, { color: couleurScore }]}>{r.verdict}</Text>
            </View>
            <View style={styles.verdictScore}>
              <Text style={[styles.scoreNombre, { color: couleurScore }]}>{score}</Text>
              <Text style={styles.scoreSur}>/ 100</Text>
              <Text style={styles.scoreLabel}>PROTECTION</Text>
            </View>
          </View>
          <Text style={styles.verdictMeta}>
            {clauses.length} point{clauses.length > 1 ? "s" : ""} examiné{clauses.length > 1 ? "s" : ""}
          </Text>
        </View>

        <Text style={styles.legende}>
          Plus le score est élevé, plus vos droits sont protégés.
        </Text>

        {/* Actions : écouter + PDF */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBouton} onPress={basculerLecture} activeOpacity={0.8}>
            <Feather name={lectureEnCours ? "pause" : "volume-2"} size={18} color={Couleurs.or} />
            <Text style={styles.actionTexte}>{lectureEnCours ? "Arrêter" : "Écouter"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBouton} onPress={genererPdf} disabled={pdfEnCours} activeOpacity={0.8}>
            <Feather name="download" size={18} color={Couleurs.or} />
            <Text style={styles.actionTexte}>{pdfEnCours ? "Génération…" : "PDF"}</Text>
          </TouchableOpacity>
        </View>

        {r.conseil_global ? (
          <View style={styles.conseil}>
            <View style={styles.conseilEtiquette}>
              <Text style={styles.conseilEtiquetteTexte}>NOTRE CONSEIL</Text>
            </View>
            <Text style={styles.conseilTexte}>{r.conseil_global}</Text>
          </View>
        ) : null}

        {triees.map((c, i) => {
          const config =
            c.statut === "rouge"
              ? { couleur: Couleurs.danger, fond: Couleurs.dangerFond, icone: "alert-triangle" as const, libelle: "DANGER" }
              : c.statut === "jaune"
              ? { couleur: Couleurs.attention, fond: Couleurs.attentionFond, icone: "alert-circle" as const, libelle: "ATTENTION" }
              : { couleur: Couleurs.conforme, fond: Couleurs.conformeFond, icone: "check-circle" as const, libelle: "CONFORME" };

          return (
            <View key={i} style={[styles.clause, { backgroundColor: config.fond, borderLeftColor: config.couleur }]}>
              <View style={[styles.etiquette, { backgroundColor: config.couleur }]}>
                <Feather name={config.icone} size={11} color="#fff" />
                <Text style={styles.etiquetteTexte}>{config.libelle}</Text>
              </View>

              <Text style={styles.extrait}>« {c.extrait} »</Text>
              <Text style={styles.analyse}>{c.analyse}</Text>

              {c.article ? (
                <View style={styles.article}>
                  <Text style={styles.articleTexte}>
                    <Text style={styles.articleLabel}>Réf. légale : </Text>{c.article}
                  </Text>
                </View>
              ) : null}

              {c.reco ? (
                <View style={styles.reco}>
                  <View style={styles.recoEtiquette}>
                    <Text style={styles.recoEtiquetteTexte}>QUE FAIRE</Text>
                  </View>
                  <Text style={styles.recoTexte}>{c.reco}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {clauses.some((c) => c.statut !== "vert") && (
          <View style={styles.droits}>
            <Text style={styles.droitsTitre}>BESOIN D'ALLER PLUS LOIN ?</Text>
            <Text style={styles.droitsTexte}>
              <Text style={styles.droitsGras}>Saisir l'ARTCI. </Text>
              Pour un problème de données personnelles, vous pouvez saisir l'Autorité de protection.
              C'est votre démarche, à votre initiative.
            </Text>
          </View>
        )}

        <View style={styles.rassurance}>
          <Feather name="lock" size={13} color={Couleurs.conforme} />
          <Text style={styles.rassuranceTexte}>
            Votre document n'a pas été conservé. Seul ce compte-rendu subsiste.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={alerteVisible} transparent animationType="fade" onRequestClose={fermerAlerte}>
        <View style={styles.overlay}>
          <View style={styles.boiteAlerte}>
            <View style={styles.alerteIcone}>
              <Feather name="alert-triangle" size={44} color={Couleurs.danger} />
            </View>
            <Text style={styles.alerteTitre}>Attention, danger</Text>
            <Text style={styles.alerteTexte}>ConsentIA a détecté</Text>
            <Text style={styles.alerteNombre}>{nbDanger}</Text>
            <Text style={styles.alerteTexte}>
              clause{nbDanger > 1 ? "s" : ""} dangereuse{nbDanger > 1 ? "s" : ""} pour vos droits.
            </Text>
            <TouchableOpacity style={styles.alerteBouton} onPress={fermerAlerte} activeOpacity={0.85}>
              <Text style={styles.alerteBoutonTexte}>J'ai compris, voir le détail</Text>
            </TouchableOpacity>
            <Text style={styles.alerteSous}>Le signal s'arrêtera à la fermeture.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EnTete({ onRetour }: { onRetour: () => void }) {
  return (
    <View style={styles.entete}>
      <TouchableOpacity style={styles.retour} onPress={onRetour} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color={Couleurs.texte} />
      </TouchableOpacity>
      <Text style={styles.enteteTitre}>Résultat de l'analyse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: Couleurs.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xxl },

  entete: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: Espacements.lg, paddingVertical: Espacements.sm },
  retour: {
    width: 40, height: 40, borderRadius: Rayons.md,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.bordure,
    alignItems: "center", justifyContent: "center",
  },
  enteteTitre: { color: Couleurs.texte, fontSize: Typo.titreS, fontWeight: Typo.semiGras },

  verdict: { borderRadius: Rayons.lg, borderWidth: 1, padding: Espacements.lg },
  verdictHaut: { flexDirection: "row", alignItems: "flex-start" },
  verdictType: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit, marginBottom: 4 },
  verdictTexte: { fontSize: Typo.titreL, fontWeight: Typo.gras },
  verdictScore: { alignItems: "flex-end" },
  scoreNombre: { fontSize: 40, fontWeight: Typo.gras, lineHeight: 44 },
  scoreSur: { color: Couleurs.texteSecondaire, fontSize: Typo.legende, marginTop: -2 },
  scoreLabel: { color: Couleurs.texteTernaire, fontSize: 9, letterSpacing: 0.8, marginTop: 2 },
  verdictMeta: { color: Couleurs.texteSecondaire, fontSize: Typo.legende, marginTop: 10 },

  legende: {
    color: Couleurs.texteTernaire, fontSize: Typo.legende, fontStyle: "italic",
    textAlign: "center", marginTop: 10, marginBottom: Espacements.md,
  },

  actions: { flexDirection: "row", gap: 12, marginBottom: Espacements.md },
  actionBouton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    backgroundColor: Couleurs.fondCarte, borderWidth: 1, borderColor: Couleurs.fondCarteBordure,
    borderRadius: Rayons.md, paddingVertical: 14,
  },
  actionTexte: { color: Couleurs.or, fontSize: Typo.corpsPetit, fontWeight: Typo.semiGras },

  conseil: {
    backgroundColor: Couleurs.fondProfond, borderRadius: Rayons.md,
    borderWidth: 1, borderColor: Couleurs.fondCarteBordure,
    padding: Espacements.md, marginBottom: Espacements.md,
  },
  conseilEtiquette: {
    alignSelf: "flex-start", backgroundColor: Couleurs.or,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Rayons.rond, marginBottom: 8,
  },
  conseilEtiquetteTexte: { color: Couleurs.texteSurOr, fontSize: 9, fontWeight: Typo.gras, letterSpacing: 0.5 },
  conseilTexte: { color: Couleurs.texte, fontSize: Typo.corpsPetit, lineHeight: 20 },

  clause: { borderRadius: Rayons.md, borderLeftWidth: 4, padding: Espacements.md, marginBottom: 12 },
  etiquette: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: Rayons.rond, marginBottom: 10,
  },
  etiquetteTexte: { color: "#fff", fontSize: 10, fontWeight: Typo.gras, letterSpacing: 0.4 },
  extrait: {
    color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit, fontStyle: "italic",
    lineHeight: 19, paddingBottom: 10, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  analyse: { color: Couleurs.texte, fontSize: Typo.corpsPetit, lineHeight: 20, marginBottom: 10 },
  article: { backgroundColor: "rgba(0,0,0,0.18)", borderRadius: Rayons.sm, padding: 9 },
  articleTexte: { color: Couleurs.texteSecondaire, fontSize: 11.5, lineHeight: 16 },
  articleLabel: { fontWeight: Typo.semiGras, color: Couleurs.texte },
  reco: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: Rayons.sm, padding: 10, marginTop: 9 },
  recoEtiquette: {
    alignSelf: "flex-start", backgroundColor: Couleurs.conforme,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: Rayons.rond, marginBottom: 6,
  },
  recoEtiquetteTexte: { color: "#fff", fontSize: 9, fontWeight: Typo.gras, letterSpacing: 0.4 },
  recoTexte: { color: Couleurs.texte, fontSize: Typo.corpsPetit, lineHeight: 19 },

  droits: {
    backgroundColor: Couleurs.fondProfond, borderRadius: Rayons.md,
    borderWidth: 1, borderColor: Couleurs.bordure, padding: Espacements.md, marginTop: 4,
  },
  droitsTitre: { color: Couleurs.or, fontSize: 11, fontWeight: Typo.gras, letterSpacing: 0.7, marginBottom: 8 },
  droitsTexte: { color: Couleurs.texteSecondaire, fontSize: Typo.corpsPetit, lineHeight: 20 },
  droitsGras: { color: Couleurs.texte, fontWeight: Typo.semiGras },

  rassurance: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: Espacements.md, padding: 12,
    backgroundColor: Couleurs.conformeFond, borderRadius: Rayons.md,
  },
  rassuranceTexte: { flex: 1, color: Couleurs.texteSecondaire, fontSize: 11.5, lineHeight: 16 },

  centreMessage: { flex: 1, alignItems: "center", justifyContent: "center", padding: Espacements.xl },
  pastilleMsg: {
    width: 72, height: 72, borderRadius: Rayons.lg,
    alignItems: "center", justifyContent: "center", marginBottom: Espacements.lg,
  },
  titreMsg: { color: Couleurs.texte, fontSize: Typo.titreM, fontWeight: Typo.semiGras, marginBottom: 10 },
  texteMsg: {
    color: Couleurs.texteSecondaire, fontSize: Typo.corps, textAlign: "center",
    lineHeight: 22, maxWidth: 320,
  },
  observe: { color: Couleurs.texteTernaire, fontSize: Typo.legende, fontStyle: "italic", marginTop: 12 },
  boutonOr: {
    backgroundColor: Couleurs.orSombre, paddingVertical: 15, paddingHorizontal: 32,
    borderRadius: Rayons.md, marginTop: Espacements.xl,
  },
  boutonOrTexte: { color: Couleurs.texteSurOr, fontSize: Typo.corps, fontWeight: Typo.gras },

  overlay: {
    flex: 1, backgroundColor: "rgba(60,10,6,0.75)",
    alignItems: "center", justifyContent: "center", padding: Espacements.lg,
  },
  boiteAlerte: {
    backgroundColor: "#fff", borderRadius: Rayons.lg, borderTopWidth: 6, borderTopColor: Couleurs.danger,
    padding: Espacements.lg, alignItems: "center", width: "100%", maxWidth: 330,
  },
  alerteIcone: { marginBottom: 10 },
  alerteTitre: {
    color: Couleurs.danger, fontSize: Typo.titreM, fontWeight: Typo.gras,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
  },
  alerteTexte: { color: "#333", fontSize: Typo.corpsPetit, textAlign: "center", lineHeight: 20 },
  alerteNombre: { color: Couleurs.danger, fontSize: 46, fontWeight: Typo.gras, lineHeight: 54 },
  alerteBouton: {
    backgroundColor: Couleurs.danger, paddingVertical: 14, borderRadius: Rayons.md,
    width: "100%", alignItems: "center", marginTop: Espacements.md,
  },
  alerteBoutonTexte: { color: "#fff", fontSize: Typo.corps, fontWeight: Typo.gras },
  alerteSous: { color: "#999", fontSize: 10.5, marginTop: 10 },
});