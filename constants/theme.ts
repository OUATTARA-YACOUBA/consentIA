/**
 * Système de design ConsentIA — Direction "Souverain"
 * Toute l'identité visuelle est centralisée ici.
 */

export const Couleurs = {
  // Fonds
  fond: "#0A2138",
  fondProfond: "#081B30",
  fondCarte: "rgba(255,255,255,0.07)",
  fondCarteBordure: "rgba(227,190,106,0.20)",

  // Or (accent principal)
  or: "#E3BE6A",
  orClair: "#EBCB7A",
  orSombre: "#D9AE55",
  orTransparent: "rgba(227,190,106,0.16)",

  // Textes
  texte: "#FFFFFF",
  texteSecondaire: "#A9C0DA",
  texteTernaire: "#7E9BBB",
  texteSurOr: "#0A2138",

  // États (verdicts d'analyse)
  danger: "#E5564A",
  dangerFond: "rgba(229,86,74,0.14)",
  attention: "#E0A73C",
  attentionFond: "rgba(224,167,60,0.14)",
  conforme: "#4CAF82",
  conformeFond: "rgba(76,175,130,0.14)",

  // Divers
  bordure: "rgba(255,255,255,0.10)",
  overlay: "rgba(5,15,28,0.75)",
};

export const Espacements = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Rayons = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  rond: 999,
};

export const Typo = {
  // Tailles
  titreXL: 28,
  titreL: 24,
  titreM: 20,
  titreS: 17,
  corps: 15,
  corpsPetit: 13.5,
  legende: 12,
  micro: 10.5,

  // Graisses
  gras: "800" as const,
  semiGras: "700" as const,
  moyen: "600" as const,
  normal: "400" as const,
};