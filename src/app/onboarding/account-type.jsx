import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, Megaphone, Camera } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import useUpload from "@/utils/useUpload";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [upload, { loading: uploading }] = useUpload();

  const [accountType, setAccountType] = useState("party-goer");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);
  const [existingUser, setExistingUser] = useState(null);

  const CITIES = ["New York City", "Miami", "Los Angeles"];

  useEffect(() => {
    // Check if user already exists (coming from auth)
    loadExistingUser();
  }, []);

  const loadExistingUser = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      const user = JSON.parse(data);
      setExistingUser(user);
      setUsername(user.username || "");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const { url, error } = await upload({
        reactNativeAsset: result.assets[0],
      });
      if (error) {
        Alert.alert("Error", "Failed to upload image");
        return;
      }
      setProfileImage(url);
    }
  };

  const handleCreateAccount = async () => {
    if (!username.trim() || !city) {
      Alert.alert("Error", "Please enter a username and select a city");
      return;
    }

    setCreating(true);
    console.log("Creating account with:", { username, city, accountType });

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          profile_image: profileImage || null,
          bio: bio.trim() || null,
          instagram_link: instagram.trim() || null,
          tiktok_link: tiktok.trim() || null,
          account_type: accountType,
          city: city,
        }),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create account");
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem("user_data", JSON.stringify(responseData));
      console.log("User data saved to AsyncStorage");

      // Navigate to main app
      console.log("Navigating to tabs");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error creating account:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create account. Please try again.",
      );
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <StatusBar style="light" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Image
              source={{
                uri: "https://ucarecdn.com/32afcda9-7aef-451f-a137-37de029f8cf5/-/format/auto/",
              }}
              style={{ width: 140, height: 140, marginBottom: 16 }}
              contentFit="contain"
            />
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Scene
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
                opacity: 0.7,
                marginBottom: 32,
                textAlign: "center",
              }}
            >
              {existingUser
                ? `heyyy ${existingUser.username}`
                : "Join the nightlife community"}
            </Text>
          </View>

          {/* Account Type Selection */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#FFFFFF",
              marginBottom: 12,
            }}
          >
            I am a...
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <Pressable
              onPress={() => setAccountType("party-goer")}
              style={{
                flex: 1,
                backgroundColor:
                  accountType === "party-goer" ? "#7B61FF" : "#222222",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 2,
                borderColor:
                  accountType === "party-goer" ? "#7B61FF" : "transparent",
              }}
            >
              <Users size={32} color="#FFFFFF" style={{ marginBottom: 8 }} />
              <Text
                style={{ fontSize: 14, fontWeight: "bold", color: "#FFFFFF" }}
              >
                Party-Goer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setAccountType("promoter")}
              style={{
                flex: 1,
                backgroundColor:
                  accountType === "promoter" ? "#FF5E5B" : "#222222",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 2,
                borderColor:
                  accountType === "promoter" ? "#FF5E5B" : "transparent",
              }}
            >
              <Megaphone
                size={32}
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{ fontSize: 14, fontWeight: "bold", color: "#FFFFFF" }}
              >
                Promoter
              </Text>
            </Pressable>
          </View>

          {/* Profile Photo */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Pressable onPress={pickImage} style={{ position: "relative" }}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "#222222",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Camera size={32} color="#666666" />
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#7B61FF",
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Camera size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>

          {/* Only show username input if no existing user */}
          {!existingUser && (
            <>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Username *
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="@username"
                placeholderTextColor="#666666"
                autoCapitalize="none"
                style={{
                  backgroundColor: "#222222",
                  color: "#FFFFFF",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  fontSize: 16,
                }}
              />
            </>
          )}

          {/* City */}
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            City *
          </Text>
          <View style={{ marginBottom: 16 }}>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCity(c)}
                style={{
                  backgroundColor: city === c ? "#7B61FF" : "#222222",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  borderWidth: 2,
                  borderColor: city === c ? "#7B61FF" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Bio
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Instagram (optional)
          </Text>
          <TextInput
            value={instagram}
            onChangeText={setInstagram}
            placeholder="instagram.com/username"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              fontSize: 16,
            }}
          />

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            TikTok (optional)
          </Text>
          <TextInput
            value={tiktok}
            onChangeText={setTiktok}
            placeholder="tiktok.com/@username"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              fontSize: 16,
            }}
          />

          <Pressable
            onPress={handleCreateAccount}
            disabled={creating || uploading}
            style={{
              backgroundColor: creating || uploading ? "#666666" : "#FF5E5B",
              borderRadius: 12,
              padding: 18,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
            >
              {creating
                ? "Creating..."
                : uploading
                  ? "Uploading..."
                  : "Create Account"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
