import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Users, Search, UserPlus, Share2, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchFriends();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/friendships?user_id=${userData.id}`);
      if (!response.ok) throw new Error("Failed to fetch friends");
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/users?search=${encodeURIComponent(searchQuery.trim())}`,
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      // Filter out self and existing friends
      const filtered = data.filter(
        (user) =>
          user.id !== userData.id &&
          !friends.some((friend) => friend.id === user.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      const response = await fetch("/api/friendships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.id,
          friend_id: friendId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send friend request");
      }

      Alert.alert("Success", "Friend request sent!");
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", error.message);
    }
  };

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on Scene, the nightlife app! Download now and connect with @${userData.username}`,
        title: "Join Scene",
      });
    } catch (error) {
      console.error("Error sharing:", error);
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
          <Users size={32} color="#7B61FF" />
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold" }}>
            Friends
          </Text>
        </View>
        <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 16 }}>
          {friends.length} friends
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#222222",
            borderRadius: 12,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Search size={20} color="#666666" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            placeholder="Search by username..."
            placeholderTextColor="#666666"
            style={{
              flex: 1,
              color: "#FFFFFF",
              paddingVertical: 16,
              paddingHorizontal: 12,
              fontSize: 16,
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X size={20} color="#666666" />
            </Pressable>
          )}
        </View>

        {/* Invite Friends Button */}
        <Pressable
          onPress={shareInvite}
          style={{
            backgroundColor: "#7B61FF",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Share2 size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
            Invite Friends
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Search Results
            </Text>
            {searchResults.map((user) => (
              <View
                key={user.id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {user.profile_image ? (
                    <Image
                      source={{ uri: user.profile_image }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#222222",
                      }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      @{user.username}
                    </Text>
                    {user.bio && (
                      <Text
                        style={{
                          color: "#FFFFFF",
                          opacity: 0.6,
                          fontSize: 13,
                        }}
                        numberOfLines={1}
                      >
                        {user.bio}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => sendFriendRequest(user.id)}
                  style={{
                    backgroundColor: "#7B61FF",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                >
                  <UserPlus size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            <View
              style={{
                height: 1,
                backgroundColor: "#333333",
                marginVertical: 24,
              }}
            />
          </>
        )}

        {/* Friends List */}
        {loading ? (
          <Text
            style={{ color: "#FFFFFF", textAlign: "center", marginTop: 40 }}
          >
            Loading friends...
          </Text>
        ) : friends.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Users size={64} color="#666666" style={{ marginBottom: 16 }} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No Friends Yet
            </Text>
            <Text
              style={{ color: "#FFFFFF", opacity: 0.6, textAlign: "center" }}
            >
              Search above to find and add friends
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Your Friends
            </Text>
            {friends.map((friend) => (
              <View
                key={friend.id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {friend.profile_image ? (
                  <Image
                    source={{ uri: friend.profile_image }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#222222",
                    }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    @{friend.username}
                  </Text>
                  {friend.bio && (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        opacity: 0.6,
                        fontSize: 13,
                      }}
                      numberOfLines={1}
                    >
                      {friend.bio}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
