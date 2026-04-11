import { View, Text, Dimensions, Alert, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";
import { Filter, Flame, TrendingUp } from "lucide-react-native";
import * as Location from "expo-location";
import { formatTimeTo12Hour } from "@/utils/formatTime";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

export default function DiscoverFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    loadUserData();
    requestLocation();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchEvents();
    }
  }, [userData, userLocation]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      });
    }
  };

  const fetchEvents = async () => {
    try {
      let url = `/api/events?city=${encodeURIComponent(userData.city)}`;
      if (userLocation) {
        url += `&user_lat=${userLocation.lat}&user_lon=${userLocation.lon}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = useCallback(
    async (eventId) => {
      try {
        const response = await fetch("/api/rsvps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userData.id, event_id: eventId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to RSVP");
        }

        // Update energy count in the local state
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, energy_count: e.energy_count + 1 } : e,
          ),
        );

        // Move to next card
        setCurrentIndex((prev) => prev + 1);
      } catch (error) {
        console.error("Error RSVPing:", error);
        Alert.alert("Error", error.message);
      }
    },
    [userData],
  );

  const handleSkip = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      const distance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2,
      );
      scale.value = interpolate(distance, [0, 300], [1, 0.95], "clamp");
    })
    .onEnd((event) => {
      const currentEvent = events[currentIndex];

      if (event.translationY < -SWIPE_THRESHOLD) {
        // Swipe up - view details
        translateY.value = withSpring(-SCREEN_HEIGHT);
        runOnJS(router.push)({
          pathname: "/(tabs)/discover/details",
          params: { id: currentEvent.id, tag: `event-${currentEvent.id}` },
        });
      } else if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - RSVP
        translateX.value = withSpring(SCREEN_WIDTH);
        runOnJS(handleRSVP)(currentEvent.id);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - skip
        translateX.value = withSpring(-SCREEN_WIDTH);
        runOnJS(handleSkip)();
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      {
        rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-30, 30])}deg`,
      },
    ],
  }));

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 18 }}>
          Loading events...
        </Text>
      </View>
    );
  }

  if (currentIndex >= events.length) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          paddingTop: insets.top,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <StatusBar style="light" />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          No More Events
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            opacity: 0.7,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Check back later for new events!
        </Text>
        <Pressable
          onPress={() => {
            setCurrentIndex(0);
            fetchEvents();
          }}
          style={{
            backgroundColor: "#FF5E5B",
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
            Refresh
          </Text>
        </Pressable>
      </View>
    );
  }

  const currentEvent = events[currentIndex];
  const nextEvent = events[currentIndex + 1];
  const heatLabel =
    currentEvent.energy_count > 200
      ? "Trending Tonight"
      : currentEvent.energy_count > 100
        ? "Heating Up"
        : currentEvent.energy_count > 50
          ? "Almost Full"
          : null;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "bold" }}>
          Discover
        </Text>
        <Pressable style={{ padding: 8 }}>
          <Filter size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Cards Container */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Next Card (underneath) */}
        {nextEvent && (
          <View
            style={{
              position: "absolute",
              width: SCREEN_WIDTH - 48,
              height: SCREEN_HEIGHT * 0.7,
              borderRadius: 24,
              overflow: "hidden",
              opacity: 0.5,
            }}
          >
            <Image
              source={{ uri: nextEvent.flyer_image }}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        )}

        {/* Current Card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              { width: SCREEN_WIDTH - 48, height: SCREEN_HEIGHT * 0.7 },
              cardStyle,
            ]}
          >
            <Transition.Pressable
              sharedBoundTag={`event-${currentEvent.id}`}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/discover/details",
                  params: {
                    id: currentEvent.id,
                    tag: `event-${currentEvent.id}`,
                  },
                })
              }
              style={{ flex: 1, borderRadius: 24, overflow: "hidden" }}
            >
              <Image
                source={{ uri: currentEvent.flyer_image }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />

              {/* Gradient Overlay */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                }}
              />

              {/* Heat Badge */}
              {heatLabel && (
                <View
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    backgroundColor: "#FFD23F",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Flame size={16} color="#111111" />
                  <Text
                    style={{
                      color: "#111111",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {heatLabel}
                  </Text>
                </View>
              )}

              {/* Boost Badge */}
              {currentEvent.boost_active && (
                <View
                  style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    backgroundColor: "#7B61FF",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <TrendingUp size={16} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    BOOSTED
                  </Text>
                </View>
              )}

              {/* Event Info */}
              <View
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  right: 24,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 32,
                    fontWeight: "bold",
                    marginBottom: 8,
                  }}
                >
                  {currentEvent.title}
                </Text>
                <Text
                  style={{ color: "#FFFFFF", fontSize: 18, marginBottom: 4 }}
                >
                  {new Date(currentEvent.event_date).toLocaleDateString(
                    "en-US",
                    { weekday: "long" },
                  )}{" "}
                  {formatTimeTo12Hour(currentEvent.event_time)}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    opacity: 0.9,
                    marginBottom: 16,
                  }}
                >
                  {currentEvent.location}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: "#FF5E5B",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      Energy: {currentEvent.energy_count}
                    </Text>
                  </View>
                  {currentEvent.vibe_tags &&
                    currentEvent.vibe_tags.slice(0, 2).map((tag) => (
                      <View
                        key={tag}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </Transition.Pressable>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Swipe Instructions */}
      <View
        style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.6 }}>
              ← Skip
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.6 }}>
              ↑ Details
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, opacity: 0.6 }}>
              RSVP →
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
