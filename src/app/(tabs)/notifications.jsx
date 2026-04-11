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
import { Bell, Calendar, UserPlus, CheckCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchNotifications();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?user_id=${userData.id}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "new_event" && notification.data?.event_id) {
      router.push({
        pathname: "/(tabs)/discover/details",
        params: { id: notification.data.event_id },
      });
    } else if (notification.type === "friend_request") {
      router.push("/(tabs)/friends");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_event":
        return <Calendar size={24} color="#7B61FF" />;
      case "friend_request":
        return <UserPlus size={24} color="#FF5E5B" />;
      default:
        return <Bell size={24} color="#FFD23F" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

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
      <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Bell size={32} color="#7B61FF" />
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold" }}>
            Notifications
          </Text>
        </View>
        <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 16 }}>
          {notifications.filter((n) => !n.read).length} unread
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7B61FF"
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Bell size={64} color="#666666" style={{ marginBottom: 16 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No Notifications
            </Text>
            <Text
              style={{ color: "#FFFFFF", opacity: 0.6, textAlign: "center" }}
            >
              You're all caught up!
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              style={{
                backgroundColor: notification.read ? "#1A1A1A" : "#222222",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: notification.read ? "transparent" : "#7B61FF",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View style={{ marginTop: 2 }}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {notification.title}
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      opacity: 0.7,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    {notification.message}
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      opacity: 0.5,
                      fontSize: 12,
                    }}
                  >
                    {formatTime(notification.created_at)}
                  </Text>
                </View>
                {notification.read && <CheckCircle size={16} color="#4CAF50" />}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
