import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X, Scan } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function QRScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      const user = JSON.parse(data);
      setUserData(user);

      // Only promoters can access scanner
      if (user.account_type !== "promoter") {
        Alert.alert("Access Denied", "Only promoters can scan tickets", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // data should be the ticket_id
      const response = await fetch("/api/rsvps/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: data,
          promoter_id: userData.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "Already checked in") {
          Alert.alert(
            "Already Checked In",
            `This ticket was checked in at ${new Date(result.checked_in_at).toLocaleString()}`,
            [{ text: "OK", onPress: () => setScanned(false) }],
          );
        } else {
          throw new Error(result.error || "Check-in failed");
        }
        return;
      }

      Alert.alert("✓ Check-in Successful!", result.message, [
        { text: "Scan Another", onPress: () => setScanned(false) },
      ]);
    } catch (error) {
      console.error("Check-in error:", error);
      Alert.alert("Error", error.message || "Failed to check in ticket", [
        { text: "Try Again", onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#111111" }} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111111",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        <StatusBar style="light" />
        <Scan size={64} color="#7B61FF" style={{ marginBottom: 24 }} />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Camera Permission Required
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            opacity: 0.7,
            fontSize: 16,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          We need camera access to scan QR codes on tickets
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: "#7B61FF",
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Header */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 16,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "bold" }}>
            Scan Ticket
          </Text>
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

        {/* Scanning Frame */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 250,
              height: 250,
              borderWidth: 2,
              borderColor: "#7B61FF",
              borderRadius: 20,
              backgroundColor: "transparent",
            }}
          />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {scanned ? "Processing..." : "Align QR code within frame"}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}
