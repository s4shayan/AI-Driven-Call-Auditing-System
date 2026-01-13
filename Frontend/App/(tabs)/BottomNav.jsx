import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Dashboard from './Dashboard';
import CallDetails from './CallDetails';
import Agents from './Agents';
import SettingTab from './SettingTab';
import ReportsAnalytics from './ReportsAnalytics';
import { Image } from 'react-native';

const Tab = createBottomTabNavigator();

const BottomNav = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,  
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#4A46D6',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../../assets/images/dashboard.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
        }}
      />
      <Tab.Screen 
        name="Calls" 
        component={CallDetails} 
        options={{
          headerTitle: 'Call Details',
          tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../../assets/images/Call.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
        }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportsAnalytics}
        options={{
          headerTitle: 'Report',
         tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../../assets/images/Chart.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
        }}
      />
      <Tab.Screen 
        name="Agents" 
        component={Agents}
        options={{
          headerTitle: 'Agents',
          tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../../assets/images/Person.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingTab}
        options={{
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => (
          <Image
            source={require('../../assets/images/Setting.png')}
            style={{ width: size, height: size, tintColor: color }}
          />
        ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNav;
