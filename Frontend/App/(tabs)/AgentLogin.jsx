import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import styles from '../../assets/styles';
import React, { useState } from 'react';
import { BASE_URL } from './BaseIP';

export default function AgentLogin({ navigation }) {
  const [name, setName] = useState('');
  const [agentCode, setagentCode] = useState('');
  const [loading, setLoading] = useState(false);

  const checkDetails = async () => {
    if (!name || !agentCode) {
      Alert.alert("Input Error", "Please enter email/Agent Name and Agent Code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/agents/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name_or_email: name.trim(),
          agent_code: agentCode
        }),
      });


      const data = await response.json();
      setLoading(false);

      if (data.success) {
        navigation.navigate('AgentReport', {
          agent_id: data.user.agent_id,
          agent_code: data.user.agent_code,
          agent_name: data.user.agent_name
        });
      } else {
        Alert.alert("Login Failed", data.message || "Email/Agent Name or Agent Code is incorrect.");
      }

    } catch (e) {
      setLoading(false);
      console.log("Login error:", e);
      Alert.alert("Login Failed", "Something went wrong. Try again.");
    }
  };

  return (
    <View>
      <Text style={styles.txt}>Access Account</Text>
      <Text style={styles.subtxt}>Access your dashboard and improve your communication</Text>

      <Text style={localStyles.label}>Email / Agent Name</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder='Enter email or Agent Name'
          autoCapitalize='none'
          onChangeText={setName}
          value={name}
        />
      </View>

      <Text style={localStyles.label}>Agent Code</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder='Enter Agent Code'
          secureTextEntry={true}
          onChangeText={setagentCode}
          value={agentCode}

        />
      </View>

      <View style={styles.btncontainer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={checkDetails}
          disabled={loading}
        >
          <Text style={styles.btntxt}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
    marginLeft: 50,
    marginTop: 20,
  },
});

