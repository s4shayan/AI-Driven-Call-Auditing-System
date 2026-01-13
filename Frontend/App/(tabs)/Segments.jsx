  import React, { useState, useEffect } from "react";
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
  import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
  import { BASE_URL } from "./BaseIP";

  const Tab = createMaterialTopTabNavigator();

  const SectionScreen = ({ content }) => (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>{content}</Text>
    </ScrollView>
  );

  const Segments = ({route}) => {
    
    const {transcript}=route.params
    const [segments, setSegments] = useState({
      greeting: "",
      body: "",
      closing: "",
    });
    const [loading, setLoading] = useState(true);


    useEffect(() => {
  const fetchSegments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/segment/${encodeURIComponent(transcript)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSegments({
        greeting: data.segments?.Greeting?.join("\n") || "No greeting segment available.",
        body: data.segments?.Body?.join("\n") || "No body segment available.",
        closing: data.segments?.Closing?.join("\n") || "No closing segment available.",
      });
    } catch (error) {
      console.error("Error fetching segments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (transcript) fetchSegments();
}, [transcript]);



    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading segments...</Text>
        </View>
      );
    }

    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#fff",
          tabBarStyle: { backgroundColor: "#007AFF" },
          tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
        }}
      >
        <Tab.Screen name="Greeting">
          {() => <SectionScreen content={segments.greeting} />}
        </Tab.Screen>
        <Tab.Screen name="Body">
          {() => <SectionScreen content={segments.body} />}
        </Tab.Screen>
        <Tab.Screen name="Closing">
          {() => <SectionScreen content={segments.closing} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  };

  export default Segments;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      margin: 20,
    },
    text: {
      fontSize: 18,
      lineHeight: 28,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
