import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Lock, User } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create user account with password
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          account_type: "party-goer", // Default, can be changed later
          city: "New York City", // Default
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create account");
      }

      const userData = await response.json();

      // Store user data
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));
      await AsyncStorage.setItem("username", username);

      Alert.alert("Success!", "Account created successfully", [
        {
          text: "Continue",
          onPress: () => router.replace("/onboarding/account-type"),
        },
      ]);
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <StatusBar style="light" />

        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 36,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              color: "#FFFFFF",
              opacity: 0.7,
              fontSize: 16,
              marginBottom: 40,
            }}
          >
            Join the nightlife community
          </Text>

          <View style={{ gap: 16, marginBottom: 32 }}>
            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Username
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#222222",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                }}
              >
                <User size={20} color="#666666" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#666666"
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    padding: 16,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#222222",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                }}
              >
                <Lock size={20} color="#666666" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#666666"
                  secureTextEntry
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: "#FFFFFF",
                    padding: 16,
                    fontSize: 16,
                  }}
                />
              </View>
              <Text
                style={{
                  color: "#FFFFFF",
                  opacity: 0.5,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Must be at least 6 characters
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#666666" : "#FF5E5B",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/auth/signin")}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: "#FFFFFF", opacity: 0.7 }}>
              Already have an account?{" "}
              <Text style={{ color: "#7B61FF", fontWeight: "600" }}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
