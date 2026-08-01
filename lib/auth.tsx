import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const CLE_ONBOARDING = "consentia_onboarding_vu";

type ContexteAuth = {
  session: Session | null;
  chargement: boolean;
  onboardingVu: boolean | null;
  marquerOnboardingVu: () => Promise<void>;
};

const Contexte = createContext<ContexteAuth>({
  session: null,
  chargement: true,
  onboardingVu: null,
  marquerOnboardingVu: async () => {},
});

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const [onboardingVu, setOnboardingVu] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CLE_ONBOARDING)
      .then((valeur) => setOnboardingVu(valeur === "1"))
      .catch(() => setOnboardingVu(true));

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChargement(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_evenement, nouvelleSession) => {
      setSession(nouvelleSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const marquerOnboardingVu = async () => {
    setOnboardingVu(true);
    try {
      await AsyncStorage.setItem(CLE_ONBOARDING, "1");
    } catch {}
  };

  return (
    <Contexte.Provider value={{ session, chargement, onboardingVu, marquerOnboardingVu }}>
      {children}
    </Contexte.Provider>
  );
}

export const useAuth = () => useContext(Contexte);