import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { BASE_URL } from "./BaseIP";

const Tab = createMaterialTopTabNavigator();

const AISummary = ({ aiSummary }) => (
  <ScrollView style={styles.container}>
    <Text style={styles.text}>{aiSummary}</Text>
  </ScrollView>
);

const parseTranscript = (text) => {
  if (!text) return [];
  // Regex to match [SPEAKER]: message
  // It looks for [Something]: and captures everything until the next [Something]: or end of string
  const parts = text.split(/(\[[^\]]+\]:\s)/).filter(part => part.trim() !== "");

  const messages = [];
  let currentSpeaker = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.match(/^\[([^\]]+)\]:\s$/)) {
      currentSpeaker = part.match(/^\[([^\]]+)\]/)[1];
    } else {
      if (currentSpeaker) {
        messages.push({
          id: i,
          speaker: currentSpeaker,
          text: part.trim(),
        });
        currentSpeaker = ""; // Reset for safety, though usually followed by next speaker
      }
    }
  }
  return messages;
};

const CallTranscript = ({ transcript, navigation }) => {
  const messages = parseTranscript(transcript);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {messages.map((msg, index) => {
          const isAgent = msg.speaker.toUpperCase() === "AGENT";
          return (
            <View
              key={index}
              style={[
                styles.bubbleContainer,
                isAgent ? styles.agentAlign : styles.customerAlign,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isAgent ? styles.agentBubble : styles.customerBubble,
                ]}
              >
                <Text style={isAgent ? styles.agentLabel : styles.customerLabel}>
                  {msg.speaker}
                </Text>
                <Text style={isAgent ? styles.agentText : styles.customerText}>
                  {msg.text}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.btncontainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              navigation.navigate("Segments", { transcript });
            }}
          >
            <Text style={styles.btntxt}>Segmented Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const Transcript = ({ navigation, route }) => {
  const { call_id } = route.params;
  const [aiSummary, setAiSummary] = useState("");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    fetchData();
  }, [call_id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/${call_id}`);
      const data = await response.json();
      setAiSummary(data.ai_summary);
      setTranscript(data.transcription_text);
    } catch (error) {
      console.log("Error fetching Transciption data", error);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#007AFF" },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
      }}
    >
      {/* 
      <Tab.Screen name="AI Summary">
        {() => <AISummary aiSummary={aiSummary} />}
      </Tab.Screen> 
*/}
      <Tab.Screen name="transcript">
        {() => (
          <CallTranscript transcript={transcript} navigation={navigation} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default Transcript;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },

  // Chat Bubble Styles
  bubbleContainer: {
    width: "100%",
    marginBottom: 15,
    flexDirection: "row",
  },
  agentAlign: {
    justifyContent: "flex-start",
  },
  customerAlign: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  agentBubble: {
    backgroundColor: "#E3F2FD", // Light Blue for Agent
    borderTopLeftRadius: 0,
  },
  customerBubble: {
    backgroundColor: "#FFFFFF", // White for Customer
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  agentLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 4,
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#616161",
    marginBottom: 4,
    textAlign: "right",
  },
  agentText: {
    fontSize: 16,
    color: "#333",
  },
  customerText: {
    fontSize: 16,
    color: "#333",
  },

  btncontainer: {
    marginTop: 30,
    alignItems: "center",
  },
  btn: {
    width: 180,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  btntxt: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
