import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
import { formatTimeTo12Hour } from "@/utils/formatTime";

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id, tag } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState(null);
  const [userData, setUserData] = useState(null);
  const [hasRSVP, setHasRSVP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUI, setShowUI] = useState(false);

  const isEventCreator = userData && event && userData.id === event.promoter_id;

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/events/${id}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Failed to delete event");
              }

              Alert.alert("Success", "Event deleted successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    loadUserData();
    fetchEvent();

    // Delay UI appearance after transition
    const timer = setTimeout(() => {
      setShowUI(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const data = await response.json();
      setEvent(data);

      // Check if user has RSVP'd
      const rsvpsResponse = await fetch(`/api/rsvps/user/${userData?.id}`);
      if (rsvpsResponse.ok) {
        const rsvps = await rsvpsResponse.json();
        setHasRSVP(rsvps.some((r) => r.event_id === parseInt(id)));
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      Alert.alert("Error", "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!userData) return;

    try {
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userData.id, event_id: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to RSVP");
      }

      setHasRSVP(true);
      setEvent((prev) => ({ ...prev, energy_count: prev.energy_count + 1 }));
      Alert.alert("Success", "You're going to this event!");
    } catch (error) {
      console.error("Error RSVPing:", error);
      Alert.alert("Error", error.message);
    }
  };

  if (loading || !event) {
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
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Event Flyer */}
        <Transition.View
          sharedBoundTag={tag}
          style={{ width: "100%", height: 500 }}
        >
          <Image
            source={{ uri: event.flyer_image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </Transition.View>

        {/* Header Buttons */}
        {showUI && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              position: "absolute",
              top: insets.top + 16,
              left: 20,
              right: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {isEventCreator && (
                <>
                  <Pressable
                    onPress={handleDelete}
                    style={{
                      backgroundColor: "rgba(255,59,48,0.9)",
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={20} color="#FFFFFF" />
                  </Pressable>
                </>
              )}
            </View>

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
          </Animated.View>
        )}

        {/* Event Details */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            {event.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              gap: 12,
            }}
          >
            <Calendar size={20} color="#FF5E5B" />
            <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
              {new Date(event.event_date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              gap: 12,
            }}
          >
            <Clock size={20} color="#FF5E5B" />
            <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
              {formatTimeTo12Hour(event.event_time)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
              gap: 12,
            }}
          >
            <MapPin size={20} color="#FF5E5B" />
            <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
              {event.location}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#FF5E5B",
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 24 }}
            >
              Energy: {event.energy_count}
            </Text>
          </View>

          {event.vibe_tags && event.vibe_tags.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 24,
              }}
            >
              {event.vibe_tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: "#222222",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {event.description && (
            <>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                About
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  lineHeight: 24,
                  opacity: 0.9,
                  marginBottom: 24,
                }}
              >
                {event.description}
              </Text>
            </>
          )}

          {/* Hosted by section */}
          <View
            style={{
              backgroundColor: "#222222",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
                gap: 12,
              }}
            >
              <User size={20} color="#FFD23F" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Hosted by {event.promoter_name}
              </Text>
            </View>
            {event.promoter_bio && (
              <Text
                style={{
                  color: "#FFFFFF",
                  opacity: 0.7,
                  fontSize: 14,
                  marginBottom: 12,
                }}
              >
                {event.promoter_bio}
              </Text>
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/promoter-profile",
                  params: { id: event.promoter_id },
                })
              }
              style={{
                backgroundColor: "#7B61FF",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}
              >
                View Profile
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* RSVP Button (only show if not event creator) */}
      {showUI && !isEventCreator && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            position: "absolute",
            bottom: insets.bottom + 20,
            left: 24,
            right: 24,
          }}
        >
          <Pressable
            onPress={handleRSVP}
            disabled={hasRSVP}
            style={{
              backgroundColor: hasRSVP ? "#666666" : "#FF5E5B",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold" }}
            >
              {hasRSVP ? "You're Going!" : "RSVP to Event"}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
