import { View, Text, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { BarChart, PieChart } from "react-native-chart-kit";
import { BASE_URL } from "./BaseIP";
const ReportsAnalytics = () => {
  const [chartData, setChartData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch bar chart data
      const response1 = await fetch(`${BASE_URL}/agentReport/agentComparison`);
      const data1 = await response1.json();

      const formattedBarData = {
        labels: data1.map((item) => item.agent_name),
        datasets: [
          {
            data: data1.map((item) => item.average_score ?? 0),
          },
        ],
      };
      setChartData(formattedBarData);

      // Fetch pie chart data
      const response2 = await fetch(`${BASE_URL}/agentReport/taskSummary`);
      const data2 = await response2.json();

      const formattedPieData = [
        {
          name: "Resolved",
          population: data2.Resolved,
          color: "#4CAF50",
          legendFontColor: "#333",
          legendFontSize: 14,
        },
        {
          name: "In Processing",
          population: data2.In_Processing,
          color: "#FF9800",
          legendFontColor: "#333",
          legendFontSize: 14,
        },
      ];
      setPieData(formattedPieData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <View>
    <ScrollView horizontal>
      {/* Bar Chart */}
      <View>
        <Text
          style={{
            textAlign: "center",
            fontSize: 20,
            marginVertical: 10,
            fontWeight: "bold",
          }}
        >
          Agent Comparison
        </Text>
        {chartData && (
          <BarChart
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  data: chartData.datasets[0].data,
                  colors: chartData.datasets[0].data.map((value) =>
                    (opacity = 1) => {
                      if (value > 75) return `rgba(0, 122, 255, ${opacity})`; // Blue
                      if (value >= 60 && value <= 75) return `rgba(255, 152, 0, ${opacity})`; // Orange
                      return `rgba(244, 67, 54, ${opacity})`; // Red
                    }
                  ),
                },
              ],
            }}
            width={Math.max(
              Dimensions.get("window").width,
              chartData.labels.length * 80
            )}
            height={350}
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#f5f5f5",
              backgroundGradientTo: "#f5f5f5",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              barPercentage: 0.6,
            }}
            verticalLabelRotation={45}
            withCustomBarColorFromData={true}   // ✅ enable custom colors
            flatColor={true}                    // ✅ make each bar flat colored
          />
        )}
      </View>
      
    </ScrollView>

      {/* Pie Chart */}
      <View style={{ marginTop: 30 }}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 20,
            marginVertical: 10,
            fontWeight: "bold",
          }}
        >
          Task Summary
        </Text>
        {pieData && (
          <PieChart
            data={pieData}
            width={Dimensions.get("window").width - 20}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        )}
      </View>
    </View>
  );
};

export default ReportsAnalytics;
