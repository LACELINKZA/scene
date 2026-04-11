import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Instagram, Music, UserPlus, UserCheck } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PromoterProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [promoter, setPromoter] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadUserData();
    fetchPromoter();
    fetchPromoterEvents();
  }, [id]);

  useEffect(() => {
    if (userData && promoter) {
      checkFollowStatus();
    }
  }, [userData, promoter]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchPromoter = async () => {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch promoter");
      const data = await response.json();
      setPromoter(data);
    } catch (error) {
      console.error("Error fetching promoter:", error);
      Alert.alert("Error", "Failed to load promoter profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoterEvents = async () => {
    try {
      const response = await fetch(`/api/events`);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      // Filter events by this promoter
      const promoterEvents = data.filter((e) => e.promoter_id === parseInt(id));
      setEvents(promoterEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(
        `/api/follows?follower_id=${userData.id}&following_id=${id}`,
      );
      if (!response.ok) return;
      const data = await response.json();
      setIsFollowing(data.is_following);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(
          `/api/follows?follower_id=${userData.id}&following_id=${id}`,
          { method: "DELETE" },
        );
        if (!response.ok) throw new Error("Failed to unfollow");
        setIsFollowing(false);
        Alert.alert("Unfollowed", `You unfollowed @${promoter.username}`);
      } else {
        // Follow
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            follower_id: userData.id,
            following_id: parseInt(id),
          }),
        });
        if (!response.ok) throw new Error("Failed to follow");
        setIsFollowing(true);
        Alert.alert(
          "Following!",
          `You'll get notified when @${promoter.username} posts new events`,
        );
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", error.message);
    }
  };

  if (loading || !promoter) {
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

      {/* Header */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          right: 24,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <X size={24} color="#FFFFFF" />
        </Pressable>
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
          {promoter.profile_image ? (
            <Image
              source={{ uri: promoter.profile_image }}
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
            @{promoter.username}
          </Text>

          <View
            style={{
              backgroundColor: "#FF5E5B",
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
              Promoter
            </Text>
          </View>

          {promoter.bio && (
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.8,
                textAlign: "center",
                fontSize: 16,
                marginBottom: 16,
              }}
            >
              {promoter.bio}
            </Text>
          )}

          {/* Social Links */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            {promoter.instagram_link && (
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
            {promoter.tiktok_link && (
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

          {/* Follow Button */}
          {userData && userData.id !== promoter.id && (
            <Pressable
              onPress={handleFollowToggle}
              style={{
                backgroundColor: isFollowing ? "#222222" : "#7B61FF",
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Following
                  </Text>
                </>
              ) : (
                <>
                  <UserPlus size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    Follow
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Events */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Upcoming Events ({events.length})
          </Text>

          {events.length === 0 ? (
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  opacity: 0.7,
                  textAlign: "center",
                }}
              >
                No upcoming events yet
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/discover/details",
                    params: { id: event.id },
                  })
                }
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  {event.flyer_image && (
                    <Image
                      source={{ uri: event.flyer_image }}
                      style={{ width: 100, height: 100 }}
                      contentFit="cover"
                    />
                  )}
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "600",
                        marginBottom: 4,
                      }}
                    >
                      {event.title}
                    </Text>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        opacity: 0.6,
                        fontSize: 13,
                      }}
                    >
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
