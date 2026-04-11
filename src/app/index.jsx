import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (userData) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/signin");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.replace("/auth/signin");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#FF5E5B" />
    </View>
  );
}
