import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import styles from '../../assets/styles'
import { BASE_URL } from './BaseIP'
const Dashboard = ({ navigation }) => {
  const [totalCalls, setTotalCalls] = useState()
  const [flaggedCalls, setFlaggedCalls] = useState('')
  const [averageCallScore, setAverageCallScore] = useState('')

  useEffect(() => {
    fetchCalls()
    fetchFlaggedCalls()
    fetchAverageCallScore()
  }, []);
  const fetchCalls = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/`);

      const calls = await response.json();

      setTotalCalls(calls.length)
    }
    catch (error) {
      console.log(error)
    }

  }

  const fetchFlaggedCalls = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/flagged_calls/`);

      const fc = await response.json();

      setFlaggedCalls(fc.flagged_calls_count)
    }
    catch (error) {
      console.log(error)
    }
  }

  const fetchAverageCallScore = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/average_call_score/`);

      const fc = await response.json();

      setAverageCallScore(fc.average_call_score)
    }
    catch (error) {
      console.log(error)
    }
  }






  return (
    <ScrollView style={localStyles.container}>
      <View>
        <Text style={localStyles.heading}>Upload Calls:</Text>
      </View>

      <View style={localStyles.imgcontainer}>
        <Image
          style={localStyles.img}
          source={require('../../assets/images/callsLogo.png')} />

        <View style={localStyles.btncontainer}>
          <TouchableOpacity style={styles.btn}
            onPress={() => { navigation.navigate('UploadCall') }}
          >
            <Text style={styles.btntxt}>Upload Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={localStyles.card}>
        <Text>Total Calls</Text>
        <Text style={localStyles.val}>{totalCalls}</Text>
        <TouchableOpacity
          onPress={() => { navigation.navigate('CallDetails') }}

        >
          <Text>▼</Text>
        </TouchableOpacity>
      </View>
      <View style={localStyles.card}>
        <Text>Flagged Calls</Text>
        <Text style={localStyles.val}>{flaggedCalls}</Text>
      </View>
      <View style={localStyles.card}>
        <Text>Average Call Score</Text>
        <Text style={localStyles.val}>{averageCallScore}%</Text>
      </View>

      <View style={localStyles.subContainer}>
        <Text>All Agents</Text>
        <TouchableOpacity
          onPress={() => { navigation.navigate('Agents') }}>
          <Text style={localStyles.arrow}>➜</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  )
}

const localStyles = StyleSheet.create({
  container: {
    margin: 10
  },

  heading: {
    fontWeight: 'bold',
    fontSize: 15
  },
  imgcontainer: {
    alignItems: 'center',
    margin: 10

  },
  img: {
    width: 200,
    height: 200,
    marginBottom: 40,

  },

  btncontainer:
  {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    marginBottom: 40
  },

  card: {
    justifyContent: 'space-between',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  val: {
    fontWeight: 'bold',
    fontSize: 30
  },
  subContainer: {
    flexDirection: 'row',
    width: 240,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    margin: 10,
    marginLeft: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 15
  },
  arrow: {
    color: '#6366F1',
    fontSize: 15
  }


}
)


export default Dashboard