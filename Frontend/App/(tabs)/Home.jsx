import React from "react";
import { View, Text, SafeAreaView, StyleSheet, Image, TouchableOpacity } from "react-native";
import styles from "../../assets/styles";

const Home = ({navigation}) => {



  return (
    <SafeAreaView style={styles.container}>
      <Image
       style={localStyles.img}
       source={require('../../assets/images/logo_transparent.png')} 
      />  
      <Text style={styles.txt}>       Welcome to Audix  </Text>
      <Text >AI-Driven Call Audting System</Text>

      <Text style={styles.subtxt}>Login with your Email or Google account to begin</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={()=>{navigation.navigate('Login')}}
        >
          <Text style={styles.btntxt}>Admin Login</Text>

      </TouchableOpacity>

       <TouchableOpacity
        style={styles.btn}
        onPress={()=>{navigation.navigate('AgentLogin')}}
        >
          <Text style={styles.btntxt}>Agent Login</Text>

      </TouchableOpacity>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
 
  img:{
    width:100,
    height:100,
    marginBottom:40,
  },

  
}
)


export default Home;