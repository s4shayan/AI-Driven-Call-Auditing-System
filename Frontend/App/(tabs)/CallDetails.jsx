import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react'
import { BASE_URL } from './BaseIP';
import DateTimePicker from '@react-native-community/datetimepicker';

const CallDetails = ({ navigation }) => {
  const [callData, setCallData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCalls();
    }, [])
  );

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const fetchCalls = async (start = null, end = null) => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/calls/`;
      if (start || end) {
        const params = new URLSearchParams();
        if (start) params.append('start_date', start);
        if (end) params.append('end_date', end);
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      const calls = await response.json();

      const callsWithDetails = await Promise.all(
        calls.map(async (call) => {
          let agentName = "Unknown";
          let username = "Unknown";

          try {
            const agentRes = await fetch(`${BASE_URL}/agents/${call.agent_id}`);

            if (agentRes.ok) {
              const agentData = await agentRes.json();
              agentName = agentData.agent_name;
            }
          } catch (error) {
            console.error("Error fetching agent:", error);
          }

          try {
            const userRes = await fetch(`${BASE_URL}/users/${call.user_id}`);

            if (userRes.ok) {
              const userData = await userRes.json();
              username = userData.username;
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }

          return {
            ...call,
            agent_name: agentName,
            username: username,
            duration: call.duration,
            status: call.compliance_status,
          };
        })
      );

      setCallData(callsWithDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching calls:", error);
      setLoading(false);
    }
  };

  const onChangeStart = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'android');
    if (selectedDate) {
      setStartDate(currentDate);
      setShowStartPicker(false);
    }
  };

  const onChangeEnd = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(currentDate);
      setShowEndPicker(false);
    }
  };

  const handleFilter = () => {
    if (!startDate && !endDate) {
      Alert.alert("Error", "Please select at least one date to filter.");
      return;
    }
    fetchCalls(formatDate(startDate), formatDate(endDate));
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    fetchCalls();
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case "Passed":
        return <Text style={{ color: "green" }}>✔</Text>;
      case "Failed":
        return <Text style={{ color: "red" }}>✖</Text>;
      case "NeedsReview":
        return <Text >⚠️</Text>;
      default:
        return null;
    }
  };

  const renderItem = ({ item }) => (
    <View style={localStyles.row}>

      <View style={localStyles.column}>
        <Text style={localStyles.bold}>{item.caller_number}</Text>
        {/* <Text style={localStyles.sub}>{item.username}</Text> */}
      </View>

      <View style={localStyles.column}>
        <Text style={localStyles.bold}>{item.agent_name}</Text>
        <Text style={localStyles.sub}>{item.duration}</Text>
      </View>


      <View style={localStyles.columnRight}>
        {renderStatusIcon(item.status)}
        <Text style={localStyles.sub}>{item.status}</Text>
      </View>

      <View style={localStyles.column}>
        <TouchableOpacity style={localStyles.btn}
          onPress={() => {
            navigation.navigate('CallAnalysis',
              {
                agent_id: item.agent_id,
                caller_number: item.caller_number,
                agent_name: item.agent_name,
                duration: item.duration,
                call_id: item.call_id

              },
              console.log(item.call_id)
            )
          }}
        >
          <Text>⏩️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <Text style={{ fontWeight: "bold", fontSize: 16, margin: 10 }}>Call Details</Text>

      {/* <View style={localStyles.filterContainer}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={localStyles.dateInput}>
          <Text style={{ color: startDate ? '#000' : '#ccc' }}>
            {startDate ? formatDate(startDate) : "Start Date (YYYY-MM-DD)"}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            testID="dateTimePickerStart"
            value={startDate || new Date()}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChangeStart}
          />
        )}

        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={localStyles.dateInput}>
          <Text style={{ color: endDate ? '#000' : '#ccc' }}>
            {endDate ? formatDate(endDate) : "End Date (YYYY-MM-DD)"}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            testID="dateTimePickerEnd"
            value={endDate || new Date()}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChangeEnd}
          />
        )}

        <View style={localStyles.buttonContainer}>
          <TouchableOpacity style={localStyles.filterBtn} onPress={handleFilter}>
            <Text style={localStyles.btnText}>Filterr     </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[localStyles.filterBtn, localStyles.clearBtn]} onPress={handleClear}>
            <Text style={localStyles.btnText}>Clearr      </Text>
          </TouchableOpacity>
        </View>
      </View> */}

      <View style={localStyles.tableHeader}>
        <Text style={localStyles.tableHeaderText}>Caller Number</Text>
        <Text style={localStyles.tableHeaderText}>Agent Name{"\n"}Call Duration</Text>
        <Text style={localStyles.tableHeaderText}>Compliance{"\n"}Status</Text>
        <Text style={localStyles.tableHeaderText}></Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#4c4acb" />
        </View>
      ) : (
        <FlatList
          data={callData}
          keyExtractor={(item) => item.call_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
};

export default CallDetails;

const localStyles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4c4acb",
    paddingVertical: 10,
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "bold",
    width: "30%",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 10,
  },
  column: {
    width: "30%",
  },
  columnRight: {
    flexDirection: "row",
    alignItems: "center",
    width: "35%",
    gap: 4,
  },
  bold: {
    fontWeight: "600",
    fontSize: 14,
  },
  sub: {
    color: "#666",
    fontSize: 12,
  },
  btn: {
    marginTop: 8,
    justifyContent: "center",
    alignContent: "center",
  },
  filterContainer: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 8,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterBtn: {
    backgroundColor: '#4c4acb',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#666',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

