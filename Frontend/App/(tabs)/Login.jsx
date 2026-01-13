import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import styles from '../../assets/styles';
import React, { useState } from 'react';
import { BASE_URL } from './BaseIP';

export default function Login({ navigation }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checkDetails = async () => {
    if (!name || !password) {
      Alert.alert("Input Error", "Please enter email/username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: name.trim(),
          password: password.trim()
        }),
      });


      const data = await response.json();
      setLoading(false);

      if (data.success) {
        navigation.navigate('BottomNav');
      } else {
        Alert.alert("Login Failed", data.message || "Email/Username or Password is incorrect.");
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

      <Text style={localStyles.label}>Email / Username</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder='Enter email or username'
          autoCapitalize='none'
          onChangeText={setName}
          value={name}
        />
      </View>

      <Text style={localStyles.label}>Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder='Enter password'
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        
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
  label:{
    fontWeight:'bold',
    marginLeft:50,
    marginTop:20,
  },
});

