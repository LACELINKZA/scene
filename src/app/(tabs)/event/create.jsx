import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Upload,
  Zap,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import useUpload from "@/utils/useUpload";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

const VIBE_TAGS = [
  "Party",
  "Music",
  "Art",
  "Chill",
  "Wild",
  "Late Night",
  "Pop Up",
];

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [upload, { loading: uploading }] = useUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeFormat, setTimeFormat] = useState("PM");
  const [flyerImage, setFlyerImage] = useState(null);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [isSecret, setIsSecret] = useState(false);
  const [wantsBoost, setWantsBoost] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      const { url, error } = await upload({
        reactNativeAsset: result.assets[0],
      });
      if (error) {
        Alert.alert("Error", "Failed to upload image");
        return;
      }
      setFlyerImage(url);
    }
  };

  const toggleVibe = (vibe) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const handleCreate = async () => {
    if (!title || !location || !date || !time) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setCreating(true);

    try {
      const userData = await AsyncStorage.getItem("user_data");
      const user = JSON.parse(userData);

      // Combine time with AM/PM
      const fullTime = `${time} ${timeFormat}`;

      // Create event
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          event_date: date,
          event_time: fullTime,
          flyer_image: flyerImage,
          vibe_tags: selectedVibes,
          promoter_id: user.id,
          is_secret: isSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      const eventData = await response.json();

      // Reset all form state
      setTitle("");
      setDescription("");
      setLocation("");
      setDate("");
      setTime("");
      setTimeFormat("PM");
      setFlyerImage(null);
      setSelectedVibes([]);
      setIsSecret(false);
      setWantsBoost(false);
      setCreating(false);

      // If boost is requested, navigate to boost purchase
      if (wantsBoost) {
        router.push({
          pathname: "/(tabs)/boost-purchase",
          params: { event_id: eventData.id, event_title: eventData.title },
        });
      } else {
        Alert.alert("Success", "Event created successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", error.message);
      setCreating(false);
    }
  };

  const handleDateSelect = (day) => {
    setDate(day.dateString);
    setShowCalendar(false);
  };

  const handleTimeSelect = (hour) => {
    const formatted = hour === 0 ? "12" : hour > 12 ? hour - 12 : hour;
    setTime(`${formatted}:00`);
    setTimeFormat(hour >= 12 ? "PM" : "AM");
    setShowTimePicker(false);
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View
        style={{ flex: 1, backgroundColor: "#111111", paddingTop: insets.top }}
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
            Create Event
          </Text>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* Flyer Upload */}
          <Pressable
            onPress={pickImage}
            style={{
              marginBottom: 24,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#222222",
              height: 300,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {flyerImage ? (
              <Image
                source={{ uri: flyerImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <>
                <Upload
                  size={48}
                  color="#666666"
                  style={{ marginBottom: 12 }}
                />
                <Text style={{ color: "#FFFFFF", opacity: 0.6, fontSize: 14 }}>
                  Upload Event Flyer
                </Text>
              </>
            )}
          </Pressable>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Event Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Warehouse Rave"
            placeholderTextColor="#666666"
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              fontSize: 16,
            }}
          />

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people about your event..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              fontSize: 16,
              minHeight: 100,
              textAlignVertical: "top",
            }}
          />

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Location *
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="123 Main St, Brooklyn"
            placeholderTextColor="#666666"
            style={{
              backgroundColor: "#222222",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              fontSize: 16,
            }}
          />

          {/* Date Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Date *
            </Text>
            <Pressable
              onPress={() => setShowCalendar(true)}
              style={{
                backgroundColor: "#222222",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CalendarIcon size={20} color="#666666" />
              <Text
                style={{
                  color: date ? "#FFFFFF" : "#666666",
                  fontSize: 16,
                  flex: 1,
                }}
              >
                {date || "Select date"}
              </Text>
            </Pressable>
          </View>

          {/* Time Picker */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              Time *
            </Text>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={{
                backgroundColor: "#222222",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Clock size={20} color="#666666" />
              <Text
                style={{
                  color: time ? "#FFFFFF" : "#666666",
                  fontSize: 16,
                  flex: 1,
                }}
              >
                {time ? `${time} ${timeFormat}` : "Select time"}
              </Text>
            </Pressable>
          </View>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Vibe Tags
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {VIBE_TAGS.map((vibe) => (
              <Pressable
                key={vibe}
                onPress={() => toggleVibe(vibe)}
                style={{
                  backgroundColor: selectedVibes.includes(vibe)
                    ? "#FF5E5B"
                    : "#222222",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: selectedVibes.includes(vibe)
                    ? "#FF5E5B"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: selectedVibes.includes(vibe) ? "600" : "400",
                  }}
                >
                  {vibe}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setWantsBoost(!wantsBoost)}
            style={{
              backgroundColor: wantsBoost ? "#FFD23F" : "#1A1A1A",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: wantsBoost ? "#FFD23F" : "#333333",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    backgroundColor: wantsBoost ? "#000000" : "#FFD23F",
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Zap
                    size={22}
                    color={wantsBoost ? "#FFD23F" : "#000000"}
                    fill={wantsBoost ? "#FFD23F" : "#000000"}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      color: wantsBoost ? "#000000" : "#FFFFFF",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Boost Event
                  </Text>
                  <Text
                    style={{
                      color: wantsBoost ? "#000000" : "#FFD23F",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    $0.99
                  </Text>
                </View>
              </View>
              <Switch
                value={wantsBoost}
                onValueChange={setWantsBoost}
                trackColor={{ false: "#444444", true: "#000000" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text
              style={{
                color: wantsBoost ? "#000000" : "#FFFFFF",
                opacity: wantsBoost ? 0.8 : 0.7,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              ⚡ Get featured on the main page for 24 hours{"\n"}📈 5x more
              visibility and RSVPs{"\n"}⭐ Stand out with premium badge
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#222222",
              borderRadius: 12,
              padding: 16,
              marginBottom: 32,
            }}
          >
            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                Secret Pop-up Event
              </Text>
              <Text style={{ color: "#FFFFFF", opacity: 0.6, fontSize: 12 }}>
                Only visible to nearby users
              </Text>
            </View>
            <Switch
              value={isSecret}
              onValueChange={setIsSecret}
              trackColor={{ false: "#444444", true: "#7B61FF" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={creating || uploading}
            style={{
              backgroundColor: creating || uploading ? "#666666" : "#FF5E5B",
              paddingVertical: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
            >
              {creating
                ? "Creating..."
                : uploading
                  ? "Uploading..."
                  : wantsBoost
                    ? "Create & Boost Event"
                    : "Create Event"}
            </Text>
          </Pressable>
        </ScrollView>

        {/* Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              padding: 20,
            }}
            onPress={() => setShowCalendar(false)}
          >
            <View onStartShouldSetResponder={() => true}>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={
                  date
                    ? { [date]: { selected: true, selectedColor: "#FF5E5B" } }
                    : {}
                }
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  calendarBackground: "#1A1A1A",
                  textSectionTitleColor: "#FFFFFF",
                  selectedDayBackgroundColor: "#FF5E5B",
                  selectedDayTextColor: "#FFFFFF",
                  todayTextColor: "#7B61FF",
                  dayTextColor: "#FFFFFF",
                  textDisabledColor: "#666666",
                  monthTextColor: "#FFFFFF",
                  arrowColor: "#FF5E5B",
                }}
              />
            </View>
          </Pressable>
        </Modal>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              padding: 20,
            }}
            onPress={() => setShowTimePicker(false)}
          >
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 16,
                padding: 20,
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
                Select Time
              </Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                  const displayHour =
                    hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const period = hour >= 12 ? "PM" : "AM";
                  return (
                    <Pressable
                      key={hour}
                      onPress={() => handleTimeSelect(hour)}
                      style={{
                        backgroundColor: "#222222",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 16,
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        {displayHour}:00 {period}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
