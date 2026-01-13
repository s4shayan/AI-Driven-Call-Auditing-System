import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native'
import { LineChart } from "react-native-chart-kit";
import React, { useEffect, useState } from 'react'
import * as Progress from 'react-native-progress';
import { useIsFocused } from '@react-navigation/native';
import { BASE_URL } from './BaseIP';





const AgentReport = ({ navigation, route }) => {
  const { agent_id, agent_code, agent_name } = route.params
  const [agentData, setAgentData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const isFocused = useIsFocused();

  useEffect(() => {
    fetchAgentDetails()
    fetchHistory()
  }, [])


  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/agentperformance/${agent_id}`)
      const agentDetails = await response.json();

      setAgentData(agentDetails)

    }
    catch (error) {
      console.log('Error Fetching Agent Details', error)
    }

  }

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/agentperformance/performance_history/${agent_id}`)
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    }
    catch (error) {
      console.log('Error Fetching Agent History', error)
    }
  }
  const deleteUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/agents/delete/${agent_id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        Alert.alert("Success", "User deleted successfully");
        navigation.goBack();
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "Failed to delete user");
      }
    } catch (error) {
      console.log(error);
    }

  };

  return (
    <ScrollView style={localStyles.container}>

      <View style={localStyles.row}>
        <View style={localStyles.leftBlock}>
          <Text style={localStyles.heading}>{agent_name}</Text>
          <Text style={localStyles.subheading}>AgentCode: {agent_code}</Text>
          <Text style={localStyles.subheading}>Total calls audited:{agentData.total_call_audited}</Text>
        </View>

        <View style={localStyles.rightBlock}>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={require('../../assets/images/Agent.png')}
            />

          </View>
          <Text style={localStyles.subheading}>Compliance: pass</Text>
        </View>

      </View>

      <View style={localStyles.containerII}>
        <View style={localStyles.metricContainer}>
          <Text style={localStyles.metricTxt}>Avg. Call Duration (min)</Text>
          <Text style={localStyles.metricValue}>{agentData.avg_call_duration}</Text>
          <Progress.Bar progress={(agentData.avg_call_duration || 0) / 6} width={200} color="#6a5acd" />
        </View>

        <View style={localStyles.metricContainer}>
          <Text style={localStyles.metricTxt}>Engagement Score</Text>
          <Text style={localStyles.metricValue}>{agentData.engagement_score}</Text>
          <Progress.Bar progress={(agentData.engagement_score || 0) / 5} width={200} color="#6a5acd" />
        </View>

        <View style={localStyles.metricContainer}>
          <Text style={localStyles.metricTxt}>Customer Satisfaction</Text>
          <Text style={localStyles.metricValue}>{agentData.csat_score}</Text>

          <Progress.Bar progress={(agentData.csat_score || 0) / 5} width={200} color="#6a5acd" />
        </View>

        <View style={localStyles.metricContainer}>
          <Text style={localStyles.metricTxt}>Overall Compliance Rate</Text>
          <Text style={localStyles.metricValue}>{agentData.overall_compliance_rate}%</Text>
          <Progress.Bar progress={(agentData.overall_compliance_rate || 0) / 100} width={200} color="#6a5acd" />
        </View>

      </View>

      {historyData.length > 0 && (
        <View style={localStyles.chartContainer}>
          <Text style={localStyles.chartTitle}>Performance Trend</Text>
          <LineChart
            data={{
              labels: historyData.map(item => {
                // Format date as MM/DD
                const date = new Date(item.call_date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }),
              datasets: [
                {
                  data: historyData.map(item => item.overall_score)
                },
                {
                  data: [0, 5], // Dummy data to force y-axis from 0 to 5
                  color: (opacity = 0) => `rgba(0,0,0,0)`, // Transparent
                  strokeWidth: 0,
                  withDots: false
                }
              ]
            }}
            width={Dimensions.get("window").width - 20} // from react-native
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero={true}
            segments={5}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(106, 90, 205, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#6a5acd"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
      )}

      <View style={localStyles.metricContainer}>
        <Text style={localStyles.recTxt}>Recommendation:</Text>
        <Text>{agentData.recommendations}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 }}>
        <TouchableOpacity
          style={localStyles.btnUpdate}
          onPress={() => navigation.navigate("updateAgent", { agent_id })}>
          <Text style={localStyles.btnText}>Update</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.btnDelete}
          onPress={deleteUser}>
          <Text style={localStyles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>



    </ScrollView>
  )
}

export default AgentReport

const localStyles = StyleSheet.create({
  container: {
    margin: 10

  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    margin: 5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexShrink: 1
  },
  subheading: {
    fontWeight: 'bold'
  },
  leftBlock: {
    flex: 1,
    margin: 10
  },
  rightBlock: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  containerII: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 50,
  },
  metricContainer: {
    margin: 10
  },
  metricTxt: {
    textAlign: 'center',
    fontWeight: 'bold',
    margin: 5,
    fontSize: 15
  },
  metricValue: {
    textAlign: 'center',
    color: '#0000EE',
    fontWeight: 'bold',
    margin: 5,
    fontSize: 15
  },
  recTxt: {
    fontWeight: 'bold',
    fontSize: 20
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  }

})

