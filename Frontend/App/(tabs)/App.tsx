import React from "react";
import { View, Text, SafeAreaView, StyleSheet, Image, TouchableOpacity, Settings } from "react-native";
import Login from "./Login";
import Home from "./Home";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AgentLogin from "./AgentLogin";
import Dashboard from "./Dashboard";
import CallDetails from "./CallDetails";
import Agents from "./Agents";
import AgentReport from "./AgentReport";
import UploadCall from "./UploadCall";
import UpdateAgent from "./updateAgent";
import CallAnalysis from "./CallAnalysis";
import Transcript from "./Transcript";
import ReportsAnalytics from "./ReportsAnalytics";
import SettingTab from "./SettingTab";
import BottomNav from "./BottomNav";
import Segments from "./Segments";




const app = () => {

  const stack=createNativeStackNavigator();


  return (
    <NavigationContainer>
      <stack.Navigator initialRouteName="Home">
      <stack.Screen name='Home' component={Home} />
      <stack.Screen name='Login' component={Login}/>
      <stack.Screen name='AgentLogin' component={AgentLogin}/>
      <stack.Screen name="Main" component={BottomNav} options={{ headerShown: false }}/>
      <stack.Screen name="BottomNav" component={BottomNav} options={{headerShown:false}} />
      {/* <stack.Screen name='Dashboard' component={Dashboard}/> */}
      <stack.Screen name='CallDetails' component={CallDetails}/>
      <stack.Screen name='Agents' component={Agents}/>
      <stack.Screen name='AgentReport' component={AgentReport}/>
      <stack.Screen name="UploadCall" component={UploadCall}/>
      <stack.Screen name="updateAgent" component={UpdateAgent}/>
      <stack.Screen name="CallAnalysis" component={CallAnalysis}/>
      <stack.Screen name="Transcript" component={Transcript}/>
      <stack.Screen name="ReportsAnalytics" component={ReportsAnalytics}/>
      <stack.Screen name="SettingTab" component={SettingTab}/>

      <stack.Screen name="Segments" component={Segments}/>



      </stack.Navigator>
    </NavigationContainer>
    
   
  );
}



export default app;