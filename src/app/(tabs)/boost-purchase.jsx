import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { TrendingUp, X, DollarSign } from "lucide-react-native";

export default function BoostPurchaseScreen() {
  const router = useRouter();
  const { event_id, event_title } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);

    try {
      // In production, integrate with Stripe or other payment processor
      // For now, we'll simulate payment verification
      const response = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id,
          payment_verified: true, // In production, this comes from payment processor
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to boost event");
      }

      Alert.alert(
        "Success!",
        "Your event has been boosted for 24 hours and will appear at the top of the feed!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error("Error purchasing boost:", error);
      Alert.alert("Error", error.message);
      setPurchasing(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111111",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
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
          Boost Event
        </Text>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <X size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
        {/* Icon */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: "#7B61FF",
              width: 100,
              height: 100,
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <TrendingUp size={48} color="#FFFFFF" />
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Boost Your Event
          </Text>
          <Text
            style={{
              color: "#FFFFFF",
              opacity: 0.7,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {event_title || "Your Event"}
          </Text>
        </View>

        {/* Benefits */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            What you get:
          </Text>
          <View style={{ gap: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#7B61FF",
                }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
                Top placement in the Discover feed
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#7B61FF",
                }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
                24 hours of increased visibility
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#7B61FF",
                }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
                "BOOSTED" badge on your event
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#7B61FF",
                }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
                Priority in Tonight mode
              </Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <View
          style={{
            backgroundColor: "#FF5E5B",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <DollarSign size={32} color="#FFFFFF" />
            <Text
              style={{ color: "#FFFFFF", fontSize: 48, fontWeight: "bold" }}
            >
              0.99
            </Text>
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 16, opacity: 0.9 }}>
            One-time payment
          </Text>
        </View>

        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing}
          style={{
            backgroundColor: purchasing ? "#666666" : "#7B61FF",
            paddingVertical: 18,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold" }}
            >
              Purchase Boost
            </Text>
          )}
        </Pressable>

        <Text
          style={{
            color: "#FFFFFF",
            opacity: 0.5,
            fontSize: 12,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          Boost will activate immediately after purchase
        </Text>
      </View>
    </View>
  );
}
