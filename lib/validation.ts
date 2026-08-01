// Règles de validation partagées — inscription et connexion

export function validerNom(valeur: string): string | null {
  const nom = valeur.trim();
  if (!nom) return "Renseignez votre nom.";
  if (nom.length < 2) return "Le nom doit contenir au moins 2 caractères.";
  if (!/[a-zA-ZÀ-ÿ]/.test(nom)) return "Le nom doit contenir des lettres.";
  return null;
}

export function validerEmail(valeur: string): string | null {
  const email = valeur.trim();
  if (!email) return "Renseignez votre adresse email.";
  // Format standard : quelque chose@domaine.extension
  const format = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!format.test(email)) return "Cette adresse email n'est pas valide.";
  return null;
}

export function validerMotDePasse(valeur: string): string | null {
  if (!valeur) return "Renseignez un mot de passe.";
  if (valeur.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[a-z]/.test(valeur)) return "Ajoutez au moins une lettre minuscule.";
  if (!/[A-Z]/.test(valeur)) return "Ajoutez au moins une lettre majuscule.";
  if (!/[0-9]/.test(valeur)) return "Ajoutez au moins un chiffre.";
  if (!/[^a-zA-Z0-9]/.test(valeur)) return "Ajoutez au moins un caractère spécial (!, @, #, etc.).";
  return null;
}

// Indicateur visuel de robustesse (0 à 4)
export function forceMotDePasse(valeur: string): number {
  let score = 0;
  if (valeur.length >= 8) score++;
  if (/[a-z]/.test(valeur) && /[A-Z]/.test(valeur)) score++;
  if (/[0-9]/.test(valeur)) score++;
  if (/[^a-zA-Z0-9]/.test(valeur)) score++;
  return score;
}
