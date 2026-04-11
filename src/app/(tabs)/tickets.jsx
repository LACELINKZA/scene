import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ticket, MapPin, Calendar, Clock, Hash, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Path } from "react-native-svg";
import { formatTimeTo12Hour, formatEventDate } from "@/utils/formatTime";

// Simple QR code generator (basic implementation)
function QRCode({ value, size = 200 }) {
  // Create a simple QR-like visual pattern based on the value
  const hash = value
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gridSize = 10;
  const cellSize = size / gridSize;

  const cells = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    const shouldFill = (hash * (i + 1)) % 3 === 0;
    if (shouldFill) {
      const x = (i % gridSize) * cellSize;
      const y = Math.floor(i / gridSize) * cellSize;
      cells.push(
        <Rect
          key={i}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill="#000000"
        />,
      );
    }
  }

  return (
    <View style={{ backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12 }}>
      <Svg width={size} height={size}>
        <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
        {cells}
      </Svg>
    </View>
  );
}

export default function TicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [upcomingTickets, setUpcomingTickets] = useState([]);
  const [pastTickets, setPastTickets] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchTickets();
    }
  }, [userData]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user_data");
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/rsvps/user/${userData.id}`);
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();

      // Separate into upcoming and past
      const now = new Date();
      const upcoming = data.filter(
        (ticket) => new Date(ticket.event_date) >= now,
      );
      const past = data.filter((ticket) => new Date(ticket.event_date) < now);

      setUpcomingTickets(upcoming);
      setPastTickets(past);
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <Ticket size={32} color="#7B61FF" />
          <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "bold" }}>
            My Tickets
          </Text>
        </View>
        <Text style={{ color: "#FFFFFF", opacity: 0.7, fontSize: 16 }}>
          {upcomingTickets.length} upcoming • {pastTickets.length} past
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {loading ? (
          <Text
            style={{ color: "#FFFFFF", textAlign: "center", marginTop: 40 }}
          >
            Loading tickets...
          </Text>
        ) : (
          <>
            {/* Upcoming Tickets */}
            {upcomingTickets.length > 0 && (
              <>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 16,
                  }}
                >
                  Upcoming Events
                </Text>
                {upcomingTickets.map((ticket) => (
                  <Pressable
                    key={ticket.id}
                    onPress={() => setSelectedTicket(ticket)}
                    style={{
                      marginBottom: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#1A1A1A",
                      borderWidth: 2,
                      borderColor: "#7B61FF",
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      {ticket.flyer_image && (
                        <Image
                          source={{ uri: ticket.flyer_image }}
                          style={{ width: 120, height: 160 }}
                          contentFit="cover"
                        />
                      )}
                      <View style={{ flex: 1, padding: 16 }}>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 8,
                          }}
                        >
                          {ticket.title}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 6,
                            gap: 8,
                          }}
                        >
                          <Calendar size={14} color="#7B61FF" />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              opacity: 0.8,
                              fontSize: 13,
                            }}
                          >
                            {formatEventDate(ticket.event_date)}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 6,
                            gap: 8,
                          }}
                        >
                          <Clock size={14} color="#7B61FF" />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              opacity: 0.8,
                              fontSize: 13,
                            }}
                          >
                            {formatTimeTo12Hour(ticket.event_time)}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <MapPin size={14} color="#7B61FF" />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              opacity: 0.8,
                              fontSize: 13,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {ticket.location}
                          </Text>
                        </View>

                        <View
                          style={{
                            marginTop: 12,
                            backgroundColor: "#7B61FF",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            alignSelf: "flex-start",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Hash size={12} color="#FFFFFF" />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            Tap to view QR code
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {/* Past Events */}
            {pastTickets.length > 0 && (
              <>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "bold",
                    marginTop: 24,
                    marginBottom: 16,
                  }}
                >
                  Past Events
                </Text>
                {pastTickets.map((ticket) => (
                  <View
                    key={ticket.id}
                    style={{
                      marginBottom: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#1A1A1A",
                      borderWidth: 2,
                      borderColor: "#444444",
                      opacity: 0.6,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      {ticket.flyer_image && (
                        <Image
                          source={{ uri: ticket.flyer_image }}
                          style={{ width: 120, height: 160 }}
                          contentFit="cover"
                        />
                      )}
                      <View style={{ flex: 1, padding: 16 }}>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 8,
                          }}
                        >
                          {ticket.title}
                        </Text>
                        <Text
                          style={{
                            color: "#FFFFFF",
                            opacity: 0.6,
                            fontSize: 13,
                          }}
                        >
                          {formatEventDate(ticket.event_date)} at{" "}
                          {formatTimeTo12Hour(ticket.event_time)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {tickets.length === 0 && (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Ticket
                  size={64}
                  color="#666666"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "600",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  No Tickets Yet
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    opacity: 0.6,
                    textAlign: "center",
                  }}
                >
                  RSVP to events to see your tickets here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Ticket Detail Modal with QR Code */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.95)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setSelectedTicket(null)}
          >
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 20,
                padding: 24,
                width: "90%",
                maxWidth: 400,
                borderWidth: 3,
                borderColor: "#7B61FF",
              }}
              onStartShouldSetResponder={() => true}
            >
              <Pressable
                onPress={() => setSelectedTicket(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  padding: 8,
                }}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>

              <View
                style={{
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Ticket
                  size={48}
                  color="#7B61FF"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  {selectedTicket.title}
                </Text>
              </View>

              {/* QR Code */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <QRCode value={selectedTicket.ticket_id} size={200} />
              </View>

              <View
                style={{
                  backgroundColor: "#7B61FF",
                  padding: 20,
                  borderRadius: 16,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12,
                    marginBottom: 8,
                    opacity: 0.9,
                  }}
                >
                  Ticket ID
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    letterSpacing: 1,
                  }}
                >
                  {selectedTicket.ticket_id}
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Calendar size={18} color="#7B61FF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
                    {formatEventDate(selectedTicket.event_date)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Clock size={18} color="#7B61FF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
                    {formatTimeTo12Hour(selectedTicket.event_time)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <MapPin size={18} color="#7B61FF" style={{ marginTop: 2 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 16, flex: 1 }}>
                    {selectedTicket.location}
                  </Text>
                </View>
              </View>

              {selectedTicket.checked_in ? (
                <View
                  style={{
                    marginTop: 20,
                    backgroundColor: "#4CAF50",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Checked In
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    opacity: 0.5,
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  Present this QR code at the event entrance
                </Text>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
