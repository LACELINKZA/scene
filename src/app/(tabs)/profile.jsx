import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Instagram,
  Music,
  LogOut,
  Calendar,
  BarChart,
  Edit,
  Bell,
  Scan,
  Users as UsersIcon,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchUnreadNotifications();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch(
        `/api/notifications?user_id=${userData.id}&unread_only=true`,
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("user_data");
          router.replace("/onboarding/account-type");
        },
      },
    ]);
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
    <View
      style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header with Notifications */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.push("/(tabs)/friends")}
          style={{
            backgroundColor: "#222222",
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <UsersIcon size={22} color="#7B61FF" />
        </Pressable>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/notifications")}
            style={{
              backgroundColor: "#222222",
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Bell size={22} color="#7B61FF" />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  backgroundColor: "#FF5E5B",
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Profile Header */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 32,
            paddingHorizontal: 24,
          }}
        >
          {userData.profile_image ? (
            <Image
              source={{ uri: userData.profile_image }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                marginBottom: 16,
              }}
            />
          ) : (
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#222222",
                marginBottom: 16,
              }}
            />
          )}

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 4,
            }}
          >
            @{userData.username}
          </Text>

          <View
            style={{
              backgroundColor:
                userData.account_type === "promoter" ? "#FF5E5B" : "#7B61FF",
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {userData.account_type === "promoter" ? "Promoter" : "Party-Goer"}
            </Text>
          </View>

          {userData.bio && (
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.8,
                textAlign: "center",
                fontSize: 16,
                marginBottom: 16,
              }}
            >
              {userData.bio}
            </Text>
          )}

          {/* Social Links */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {userData.instagram_link && (
              <View
                style={{
                  backgroundColor: "#222222",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Instagram size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
                  Instagram
                </Text>
              </View>
            )}
            {userData.tiktok_link && (
              <View
                style={{
                  backgroundColor: "#222222",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Music size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12 }}>TikTok</Text>
              </View>
            )}
          </View>
        </View>

        {/* Promoter Buttons */}
        {userData.account_type === "promoter" && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24, gap: 12 }}>
            <Pressable
              onPress={() => router.push("/(tabs)/scanner")}
              style={{
                backgroundColor: "#7B61FF",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              <Scan size={20} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
              >
                Scan Tickets
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/dashboard")}
              style={{
                backgroundColor: "#FF5E5B",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                paddingVertical: 16,
                borderRadius: 12,
              }}
            >
              <BarChart size={20} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
              >
                View Dashboard
              </Text>
            </Pressable>
          </View>
        )}

        {/* Edit Profile and Logout Buttons */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/edit-profile")}
            style={{
              backgroundColor: "#7B61FF",
              paddingVertical: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Edit size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: "#222222",
              paddingVertical: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogOut size={20} color="#FF5E5B" />
            <Text style={{ color: "#FF5E5B", fontSize: 16, fontWeight: "600" }}>
              Logout
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
