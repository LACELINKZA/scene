import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  BarChart,
  Eye,
  Users,
  TrendingUp,
  Plus,
  Calendar,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchDashboard();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/promoter/dashboard/${userData.id}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading || !dashboardData) {
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
          paddingHorizontal: 24,
          paddingVertical: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <BarChart size={32} color="#FF5E5B" />
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold" }}>
            Dashboard
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/event/create")}
          style={{
            backgroundColor: "#FF5E5B",
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </Pressable>
      </View>

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
        {/* Overview Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Users size={24} color="#FF5E5B" style={{ marginBottom: 8 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {dashboardData.total_rsvps}
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.7,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Total RSVPs
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Eye size={24} color="#7B61FF" style={{ marginBottom: 8 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {dashboardData.total_views}
            </Text>
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.7,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Total Views
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          <Calendar size={24} color="#FFD23F" style={{ marginBottom: 8 }} />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 4,
            }}
          >
            {dashboardData.upcoming_events}
          </Text>
          <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 12 }}>
            Upcoming Events
          </Text>
        </View>

        {/* Events List */}
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          Your Events
        </Text>

        {dashboardData.events.length === 0 ? (
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
              padding: 32,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Calendar size={48} color="#666666" style={{ marginBottom: 12 }} />
            <Text
              style={{
                color: "#FFFFFF",
                opacity: 0.7,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              No events created yet
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/event/create")}
              style={{
                backgroundColor: "#FF5E5B",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                Create Your First Event
              </Text>
            </Pressable>
          </View>
        ) : (
          dashboardData.events.slice(0, 10).map((event) => (
            <View
              key={event.event_id}
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 18,
                      fontWeight: "bold",
                      marginBottom: 4,
                    }}
                  >
                    {event.title}
                  </Text>
                  <Text
                    style={{ color: "#FFFFFF", opacity: 0.6, fontSize: 12 }}
                  >
                    {new Date(event.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {event.event_time}
                  </Text>
                </View>
                {event.boost_active && (
                  <View
                    style={{
                      backgroundColor: "#7B61FF",
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      BOOSTED
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 16 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Eye size={16} color="#7B61FF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {event.views}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Users size={16} color="#FF5E5B" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {event.rsvps} RSVPs
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <TrendingUp size={16} color="#FFD23F" />
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {event.energy_count}
                  </Text>
                </View>
              </View>

              {!event.boost_active && (
                <Pressable
                  onPress={async () => {
                    try {
                      const response = await fetch("/api/boost", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event_id: event.event_id }),
                      });
                      if (response.ok) {
                        fetchDashboard();
                      }
                    } catch (error) {
                      console.error("Error boosting event:", error);
                    }
                  }}
                  style={{
                    backgroundColor: "#7B61FF",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    Boost Event - $0.99
                  </Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
