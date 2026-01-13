import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { pick, keepLocalCopy, types } from '@react-native-documents/picker';
import { BASE_URL } from "./BaseIP";



const UploadCalls = ({ navigation }) => {
  const [fileInfo, setFileInfo] = useState(null);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [callerNumber, setCallerNumber] = useState("");
  const [numSpeakers, setNumSpeakers] = useState(2);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchUser();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/agents/`);
      const agentData = await response.json();
      setAgents(agentData);
    } catch (error) {
      console.log("Error Fetching Agents:", error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/`);
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.log("Error Fetching Users:", error);
    }
  };

  const handlePickFile = async () => {
    try {
      const [file] = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });

      const [copy] = await keepLocalCopy({
        files: [{ uri: file.uri, fileName: file.name ?? 'unknown.mp3' }],
        destination: 'documentDirectory',
      });

      setFileInfo({
        name: file.name,
        uri: copy.localUri ?? file.uri,
      });
    } catch (err) {
      if (err?.code === 'CANCEL') {
        console.log("User cancelled file picker");
      } else {
        console.error("Error picking file:", err);
      }
    }
  };

  const uploadCall = async () => {
    if (!selectedAgent || !selectedUser || !callerNumber || !fileInfo) {
      alert("Please fill all fields and select an audio file.");
      return;
    }

    try {
      setLoading(true);

      let formData = new FormData();

      formData.append("agent_id", selectedAgent);
      formData.append("user_id", selectedUser);
      formData.append("caller_number", callerNumber);
      formData.append("num_speakers", numSpeakers);

      formData.append("audio_file", {
        uri: fileInfo.uri,
        type: "audio/mpeg",
        name: fileInfo.name || "call_audio.mp3",
      });

      const response = await fetch(`${BASE_URL}/calls/uploadCall`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Call uploaded successfully!");
        navigation.goBack();
      } else {
        console.log("Upload error:", data);
        alert("Upload failed");
      }

    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Call</Text>
      </View>

      <View style={styles.container22}>
        <Text style={styles.label22}>Select an Agent:</Text>
        <Picker
          selectedValue={selectedAgent}
          onValueChange={(itemValue) => setSelectedAgent(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Agent" value="" />
          {agents.map((agent) => (
            <Picker.Item
              key={agent.agent_id}
              label={agent.agent_name}
              value={agent.agent_id}
            />
          ))}
        </Picker>

        <Text style={styles.label22}>Select User ID:</Text>
        <Picker
          selectedValue={selectedUser}
          onValueChange={(itemValue) => setSelectedUser(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select User" value="" />
          {users.map((user) => (
            <Picker.Item
              key={user.user_id}
              label={user.user_name || user.user_id.toString()}
              value={user.user_id}
            />
          ))}
        </Picker>

        <Text style={styles.label22}>Enter Caller Number</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g: 03491566986"
            onChangeText={setCallerNumber}
          />
        </View>

        <Text style={styles.label22}>Number of Speakers</Text>
        <View style={styles.speakerContainer}>
          <TouchableOpacity
            style={[styles.speakerBtn, numSpeakers === 2 && styles.speakerBtnActive]}
            onPress={() => setNumSpeakers(2)}
          >
            <Text style={[styles.speakerText, numSpeakers === 2 && styles.speakerTextActive]}>2 Speakers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.speakerBtn, numSpeakers === 3 && styles.speakerBtnActive]}
            onPress={() => setNumSpeakers(3)}
          >
            <Text style={[styles.speakerText, numSpeakers === 3 && styles.speakerTextActive]}>3 Speakers</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.dropBox} onPress={handlePickFile}>
          <Image
            source={require('../../assets/images/uploadLogo.png')}
            style={styles.icon}
          />
          <Text style={styles.dropText}>Drop files here</Text>
          <Text style={styles.supportedText}>Supported format: MP3</Text>
          <Text style={styles.orText}>OR</Text>
          <Text style={styles.browseText}>Browse files</Text>
        </TouchableOpacity>
        {fileInfo && (
          <Text style={styles.selectedFile}>📂 {fileInfo.name}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadBtn, loading && { opacity: 0.5 }]}
          onPress={uploadCall}
          disabled={loading}
        >
          <Text style={styles.uploadText}>Upload   </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, marginTop: 10 }}>
              Uploading...
            </Text>
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 5 }}>
              Please wait while your call is processed.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default UploadCalls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dropBox: {
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  dropText: {
    fontSize: 16,
    fontWeight: "500",
  },
  supportedText: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  orText: {
    marginVertical: 10,
    fontSize: 12,
    color: "gray",
  },
  browseText: {
    fontSize: 14,
    color: "#4a90e2",
    fontWeight: "600",
  },
  selectedFile: {
    marginTop: 10,
    fontSize: 13,
    color: "green",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    fontSize: 16,
    color: "gray",
  },
  uploadBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  container22: {
    flex: 1,
    padding: 5,
  },
  label22: {
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    backgroundColor: '#cccc',
    borderColor: '#cccc',
    borderWidth: 1,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    margin: 30,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: "#333",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    width: 220,
  },
  speakerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  speakerBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  speakerBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  speakerText: {
    fontSize: 16,
    color: '#333',
  },
  speakerTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
