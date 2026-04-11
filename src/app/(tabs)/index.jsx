import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Calendar, MapPin, ExternalLink, Search } from "lucide-react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PopUpsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [popUps, setPopUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchPopUps();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchPopUps = async () => {
    try {
      const response = await fetch(`/api/events?city=${userData.city}`);
      if (!response.ok) throw new Error("Failed to fetch pop-ups");
      const data = await response.json();

      // Filter for Pop Up events
      const popUpEvents = data.filter(
        (event) => event.vibe_tags && event.vibe_tags.includes("Pop Up"),
      );

      setPopUps(popUpEvents);
    } catch (error) {
      console.error("Error fetching pop-ups:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPopUps();
  };

  const handleExternalRSVP = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open URL:", err);
      });
    }
  };

  const filteredPopUps = popUps.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header with Logo */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderColor: "#222222",
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image
            source={{
              uri: "https://ucarecdn.com/32afcda9-7aef-451f-a137-37de029f8cf5/-/format/auto/",
            }}
            style={{ width: 80, height: 80 }}
            contentFit="contain"
          />
        </View>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Pop-Ups Near You
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            opacity: 0.6,
            fontSize: 14,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          Brand activations • Food • Fashion • Art
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#222222",
            borderRadius: 12,
            paddingHorizontal: 16,
            marginTop: 16,
          }}
        >
          <Search size={20} color="#666666" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search pop-ups..."
            placeholderTextColor="#666666"
            style={{
              flex: 1,
              color: "#FFFFFF",
              paddingVertical: 14,
              paddingHorizontal: 12,
              fontSize: 16,
            }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: insets.bottom + 80,
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
            Loading pop-ups...
          </Text>
        ) : filteredPopUps.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Calendar size={64} color="#333333" style={{ marginBottom: 16 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              No Pop-Ups Found
            </Text>
            <Text
              style={{ color: "#FFFFFF", opacity: 0.6, textAlign: "center" }}
            >
              {searchQuery
                ? "Try a different search"
                : `Check back soon for upcoming pop-ups in ${userData?.city || "your city"}`}
            </Text>
          </View>
        ) : (
          filteredPopUps.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => {
                if (event.is_admin_created && event.external_rsvp_link) {
                  handleExternalRSVP(event.external_rsvp_link);
                } else {
                  router.push({
                    pathname: "/(tabs)/discover/details",
                    params: { id: event.id },
                  });
                }
              }}
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {event.flyer_image && (
                <Image
                  source={{ uri: event.flyer_image }}
                  style={{ width: "100%", height: 200 }}
                  contentFit="cover"
                />
              )}
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 8,
                  }}
                >
                  {event.title}
                </Text>

                {event.description && (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      opacity: 0.7,
                      fontSize: 14,
                      marginBottom: 12,
                      lineHeight: 20,
                    }}
                    numberOfLines={2}
                  >
                    {event.description}
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Calendar size={16} color="#7B61FF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {new Date(event.event_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {event.event_time}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <MapPin size={16} color="#FF5E5B" />
                  <Text
                    style={{ color: "#FFFFFF", fontSize: 14, flex: 1 }}
                    numberOfLines={1}
                  >
                    {event.location}
                  </Text>
                </View>

                {/* Show external RSVP link if admin created */}
                {event.is_admin_created && event.external_rsvp_link && (
                  <Pressable
                    onPress={() => handleExternalRSVP(event.external_rsvp_link)}
                    style={{
                      backgroundColor: "#7B61FF",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 12,
                      borderRadius: 8,
                    }}
                  >
                    <ExternalLink size={16} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                      RSVP Required
                    </Text>
                  </Pressable>
                )}

                {/* Show vibe tags */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 12,
                  }}
                >
                  {event.vibe_tags
                    ?.filter((tag) => tag !== "Pop Up")
                    .map((tag) => (
                      <View
                        key={tag}
                        style={{
                          backgroundColor: "#222222",
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 11,
                            opacity: 0.8,
                          }}
                        >
                          {tag}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
