import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { X, Camera } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useUpload from "@/utils/useUpload";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [upload, { loading: uploading }] = useUpload();

  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  const CITIES = ["New York City", "Miami", "Los Angeles"];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      const user = JSON.parse(data);
      setUserData(user);
      setProfileImage(user.profile_image || "");
      setBio(user.bio || "");
      setInstagram(user.instagram_link || "");
      setTiktok(user.tiktok_link || "");
      setCity(user.city || "");
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

  const handleSave = async () => {
    if (!city) {
      Alert.alert("Error", "Please select a city");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_image: profileImage || null,
          bio: bio.trim() || null,
          instagram_link: instagram.trim() || null,
          tiktok_link: tiktok.trim() || null,
          city: city,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const updatedUser = await response.json();
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message);
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
      >
        <StatusBar style="light" />

        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderColor: "#222222",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "bold" }}>
            Edit Profile
          </Text>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* Profile Photo */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Pressable onPress={pickImage} style={{ position: "relative" }}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                />
              ) : (
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
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
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Camera size={20} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.6,
                fontSize: 14,
                marginTop: 12,
              }}
            >
              Tap to change photo
            </Text>
          </View>

          {/* Username (read-only) */}
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
              backgroundColor: "#222222",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              opacity: 0.6,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
              @{userData.username}
            </Text>
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              opacity: 0.5,
              fontSize: 12,
              marginTop: -12,
              marginBottom: 20,
            }}
          >
            Username cannot be changed
          </Text>

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
          <View style={{ marginBottom: 20 }}>
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
              marginBottom: 20,
              fontSize: 16,
              minHeight: 100,
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
              marginBottom: 20,
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
              marginBottom: 32,
              fontSize: 16,
            }}
          />

          <Pressable
            onPress={handleSave}
            disabled={saving || uploading}
            style={{
              backgroundColor: saving || uploading ? "#666666" : "#7B61FF",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
            >
              {saving
                ? "Saving..."
                : uploading
                  ? "Uploading..."
                  : "Save Changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
