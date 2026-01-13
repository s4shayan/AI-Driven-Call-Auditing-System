import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState,useEffect } from 'react';
import { BASE_URL } from './BaseIP';
const UpdateAgent = ({route,navigation}) => {
  const {agent_id} = route.params;

  const [agent_name,setName]=useState("");
  const [agent_email,setEmail]=useState("");
  const [agent_code,setCode]=useState("");

  
  
      useEffect(()=>{
          fetchAgents();
      },[])
  
      const fetchAgents=async()=>{
          try{   
              const response=await fetch(`${BASE_URL}/agents/`);
              // const response=await fetch(`http://192.168.0.106:8000/agents/${agent_id}`);
  
              const agentData=await response.json();
              setName(agentData.agent_name);
              setEmail(agentData.email);
              setCode(agentData.agent_code);
          }
          catch(error)
          {
              console.log("Error Fetching Data",error)
          }
      }

  
  const update = async () => {
  try {
    const response = await fetch(`${BASE_URL}/agents/update/${agent_id}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_name, email:agent_email, agent_code })
    });

    if (response.ok) {
      Alert.alert("Success", "Agent updated successfully");
      navigation.goBack();
    } else {
      const err = await response.json();
      const message = Array.isArray(err.detail) ? err.detail.join(", ") : String(err.detail || "Failed to update agent");
      Alert.alert("Error", message);
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agent_Id: {agent_id}</Text>

      <TextInput
        style={styles.input}
        value={agent_name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        value={agent_email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        value={agent_code}
        onChangeText={setCode}
      />

      <TouchableOpacity style={styles.btnUpdate} onPress={update}>
        <Text style={styles.btnText}>Updatee</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UpdateAgent;

const styles=StyleSheet.create({
  container:{
    flex:1,
    justifyContent:'center',
    padding:20
  },

  label:{
    fontSize:18,
    fontWeight:'bold',
    marginBottom:10
  },
 
  input:{
    borderWidth:1,
    borderColor:'#ccc',
    padding:10,
    marginBottom:15,
    borderRadius:8
  },
  btnUpdate:{
    backgroundColor:'blue',
    padding:12,
    borderRadius:8,
    alignItems:'center'
  },
  btnText:{
    color:'white',
    fontWeight:'bold',
    fontSize:14
  }
});
