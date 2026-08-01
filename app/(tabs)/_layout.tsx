import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Couleurs } from "../../constants/theme";

export default function LayoutOnglets() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Couleurs.or,
        tabBarInactiveTintColor: "#6E89A8",
        tabBarStyle: {
          backgroundColor: Couleurs.fondProfond,
          borderTopColor: "rgba(227,190,106,0.13)",
          borderTopWidth: 1,
          height: 60 + insets.bottom,   // la barre s'adapte au téléphone
          paddingTop: 8,
          paddingBottom: insets.bottom, // marge réelle, pas une valeur devinée
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, size }) => <Feather name="camera" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: "Historique",
          tabBarIcon: ({ color, size }) => <Feather name="clock" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}