import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Flame, MapPin, Users, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const CITIES = ["New York City", "Miami", "Los Angeles"];

export default function TonightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    loadUserData();
    requestLocation();
  }, []);

  useEffect(() => {
    if (userData) {
      setSelectedCity(userData.city);
      fetchTonightEvents();
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

  const fetchTonightEvents = async () => {
    try {
      const city = selectedCity || userData?.city;
      let url = `/api/events?city=${encodeURIComponent(city)}&tonight_mode=true`;
      if (userLocation) {
        url += `&user_lat=${userLocation.lat}&user_lon=${userLocation.lon}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching tonight events:", error);
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCityChange = async (city) => {
    setSelectedCity(city);
    setCityModalVisible(false);

    // Update user data
    const updatedUserData = { ...userData, city };
    setUserData(updatedUserData);
    await AsyncStorage.setItem("user_data", JSON.stringify(updatedUserData));

    // Update in database
    try {
      await fetch(`/api/users/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
    } catch (error) {
      console.error("Error updating city:", error);
    }

    // Refresh events
    setLoading(true);
    fetchTonightEvents();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTonightEvents();
  };

  const handleRSVP = async (eventId) => {
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

      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, energy_count: e.energy_count + 1 } : e,
        ),
      );

      Alert.alert("Success", "You're going!");
    } catch (error) {
      console.error("Error RSVPing:", error);
      Alert.alert("Error", error.message);
    }
  };

  const currentHour = new Date().getHours();
  const isTonightMode = currentHour >= 19; // After 7PM

  return (
    <View
      style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
        {/* City Filter & Logo Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => setCityModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#222222",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              gap: 6,
            }}
          >
            <MapPin size={16} color="#FF5E5B" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
              {selectedCity || "Select City"}
            </Text>
          </Pressable>

          <Image
            source={{
              uri: "https://ucarecdn.com/32afcda9-7aef-451f-a137-37de029f8cf5/-/format/auto/",
            }}
            style={{ width: 60, height: 60 }}
            contentFit="contain"
          />

          <View style={{ width: 90 }} />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Flame size={32} color="#FFD23F" />
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold" }}>
            Tonight
          </Text>
        </View>
        <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 16 }}>
          {isTonightMode
            ? "Events happening in the next 6 hours"
            : "Tonight mode activates at 7 PM"}
        </Text>
      </View>

      {/* City Selection Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setCityModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 24,
              width: "85%",
              maxWidth: 400,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Select Your City
            </Text>

            {CITIES.map((city) => (
              <Pressable
                key={city}
                onPress={() => handleCityChange(city)}
                style={{
                  backgroundColor:
                    selectedCity === city ? "#7B61FF" : "#222222",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: selectedCity === city ? "600" : "400",
                  }}
                >
                  {city}
                </Text>
                {selectedCity === city && <Check size={20} color="#FFFFFF" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF5E5B"
          />
        }
      >
        {loading ? (
          <Text
            style={{ color: "#FFFFFF", textAlign: "center", marginTop: 40 }}
          >
            Loading...
          </Text>
        ) : events.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Flame size={64} color="#666666" style={{ marginBottom: 16 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No Events Tonight
            </Text>
            <Text
              style={{ color: "#FFFFFF", opacity: 0.6, textAlign: "center" }}
            >
              {isTonightMode
                ? "Check back later or browse Discover"
                : "Check back after 7 PM"}
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <Pressable
              key={event.id}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/discover/details",
                  params: { id: event.id, tag: `tonight-${event.id}` },
                })
              }
              style={{
                marginBottom: 20,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#1A1A1A",
              }}
            >
              <Image
                source={{ uri: event.flyer_image }}
                style={{ width: "100%", height: 200 }}
                contentFit="cover"
              />

              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 22,
                    fontWeight: "bold",
                    marginBottom: 8,
                  }}
                >
                  {event.title}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    gap: 8,
                  }}
                >
                  <MapPin size={16} color="#FF5E5B" />
                  <Text
                    style={{ color: "#FFFFFF", opacity: 0.8, fontSize: 14 }}
                  >
                    {event.location}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                    gap: 8,
                  }}
                >
                  <Users size={16} color="#FFD23F" />
                  <Text
                    style={{
                      color: "#FFD23F",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {event.energy_count} going
                  </Text>
                </View>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRSVP(event.id);
                  }}
                  style={{
                    backgroundColor: "#FF5E5B",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    RSVP Now
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
