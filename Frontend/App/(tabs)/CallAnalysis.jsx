import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Progress from 'react-native-progress';
import CheckBox from '@react-native-community/checkbox';
import styles from '../../assets/styles';
import { BASE_URL } from './BaseIP';

const CallAnalysis = ({ navigation, route }) => {

  const { call_id, caller_number, agent_name, duration } = route.params
  const [callData, setCallData] = useState({})
  // Initialize to object to strictly avoid undefined issues, though [] worked loosely.

  const [includeGreeting, setIncludeGreeting] = useState(true);
  const [includeKnowledge, setIncludeKnowledge] = useState(true);
  const [includeEmpathy, setIncludeEmpathy] = useState(true);
  const [includeClosing, setIncludeClosing] = useState(true);

  const [expandedSection, setExpandedSection] = useState({});

  const toggleSection = (section) => {
    setExpandedSection(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFormattedBreakdown = () => {
    try {
      if (!callData.score_breakdown) return {};
      if (typeof callData.score_breakdown === 'string') {
        return JSON.parse(callData.score_breakdown);
      }
      return callData.score_breakdown;
    } catch (e) {
      console.log("Error parsing score_breakdown:", e);
      return {};
    }
  };

  const formattedBreakdown = getFormattedBreakdown();


  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const response = await fetch(`${BASE_URL}/calls/${call_id}`)
      const data = await response.json()
      setCallData(data)
    } catch (error) {
      console.log("Error fetching Data", error)
    }
  }

  const getBarColor = (score) => {
    if (score > 4) return "blue";
    if (score >= 3) return "orange";
    return "red";
  };

  const calculateOverallScore = () => {
    let total = 0;
    let count = 0;

    if (includeGreeting && callData.greeting_score !== undefined && callData.greeting_score !== null) {
      total += callData.greeting_score;
      count++;
    }
    if (includeKnowledge && callData.knowledge_score !== undefined && callData.knowledge_score !== null) {
      total += callData.knowledge_score;
      count++;
    }
    if (includeEmpathy && callData.empathy_score !== undefined && callData.empathy_score !== null) {
      total += callData.empathy_score;
      count++;
    }
    if (includeClosing && callData.closing_score !== undefined && callData.closing_score !== null) {
      total += callData.closing_score;
      count++;
    }

    return count === 0 ? 0 : total / count;
  };

  const simulatedScore = calculateOverallScore();
  const originalScore = callData.overall_score || 0;
  // Use a small epsilon for float comparison logic, though direct comparison might work if calculated same way.
  // Assuming 2 decimal places precision is enough to detect difference
  const showSimulated = Math.abs(simulatedScore - originalScore) > 0.001;

  return (

    <ScrollView style={localStyles.container}>
      <View style={localStyles.row}>
        <View style={localStyles.column}>
          <Text>Caller Number</Text>
          <Text style={localStyles.bold}>{caller_number}</Text>
        </View>
        <View style={localStyles.column}>
          <Text>Agent Name</Text>
          <Text style={localStyles.bold}>{agent_name}</Text>
        </View>
        <View style={localStyles.column}>
          <Text>Duration</Text>
          <Text style={localStyles.bold}>{duration} min</Text>
        </View>
      </View>

      <View style={localStyles.scoreContainer}>
        <View style={localStyles.rowLabel}>
          <View style={localStyles.labelWithCheckbox}>
            <CheckBox
              disabled={false}
              value={includeGreeting}
              onValueChange={(newValue) => setIncludeGreeting(newValue)}
            />
            <TouchableOpacity onPress={() => toggleSection('greeting')}>
              <Text style={localStyles.label}>Greeting      </Text>
            </TouchableOpacity>
          </View>
          <Text style={localStyles.score}>{(callData.greeting_score * 20).toFixed(1)}%    </Text>
        </View>
        <TouchableOpacity onPress={() => toggleSection('greeting')}>
          <Progress.Bar progress={(callData.greeting_score || 0) / 5} width={300} color={getBarColor(callData.greeting_score)} />
        </TouchableOpacity>

        {expandedSection['greeting'] && formattedBreakdown.greeting && (
          <View style={localStyles.breakdownContainer}>
            {['Politeness', 'Clarity', 'Context', 'Completeness'].map((metric) => (
              <View key={metric} style={localStyles.subScoreRow}>
                <Text style={localStyles.subScoreLabel}>{metric}</Text>
                <View style={localStyles.subScoreRight}>
                  <Progress.Bar
                    progress={(formattedBreakdown.greeting[metric] || 0) / 5}
                    width={150}
                    height={8}
                    color={getBarColor(formattedBreakdown.greeting[metric] || 0)}
                  />
                  <Text style={localStyles.subScoreValue}>
                    {formattedBreakdown.greeting[metric] || 0}/5
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={localStyles.scoreContainer}>
        <View style={localStyles.rowLabel}>
          <View style={localStyles.labelWithCheckbox}>
            <CheckBox
              disabled={false}
              value={includeKnowledge}
              onValueChange={(newValue) => setIncludeKnowledge(newValue)}
            />
            <TouchableOpacity onPress={() => toggleSection('knowledge')}>
              <Text style={localStyles.label}>Knowledge    </Text>
            </TouchableOpacity>
          </View>
          <Text style={localStyles.score}>{(callData.knowledge_score * 20).toFixed(1)}%   </Text>
        </View>
        <TouchableOpacity onPress={() => toggleSection('knowledge')}>
          <Progress.Bar progress={(callData.knowledge_score || 0) / 5} width={300} color={getBarColor(callData.knowledge_score)} />
        </TouchableOpacity>

        {expandedSection['knowledge'] && formattedBreakdown.knowledge && (
          <View style={localStyles.breakdownContainer}>
            <Text style={localStyles.subHeader}>Sentences that did not match:</Text>
            {formattedBreakdown.knowledge.matches && formattedBreakdown.knowledge.matches
              .filter(m => m.validation_label !== 'Entailment')
              .length > 0 ? (
              formattedBreakdown.knowledge.matches
                .filter(m => m.validation_label !== 'Entailment')
                .map((m, idx) => (
                  <View key={idx} style={localStyles.matchRow}>
                    <Text style={localStyles.matchText}>• "{m.sentence}"</Text>
                    <Text style={[localStyles.matchText, { color: '#555', marginTop: 4, fontStyle: 'italic' }]}>
                      Expected Rule: "{m.rule_content}"
                    </Text>
                    <Text style={localStyles.matchReason}>({m.validation_label} - {m.rule_category})</Text>
                  </View>
                ))
            ) : (
              <Text style={localStyles.noIssuesText}>All matched topics satisfied knowledge rules.</Text>
            )
            }
          </View>
        )}
      </View>

      <View style={localStyles.scoreContainer}>
        <View style={localStyles.rowLabel}>
          <View style={localStyles.labelWithCheckbox}>
            <CheckBox
              disabled={false}
              value={includeEmpathy}
              onValueChange={(newValue) => setIncludeEmpathy(newValue)}
            />
            <TouchableOpacity onPress={() => toggleSection('empathy')}>
              <Text style={localStyles.label}>Empathy    </Text>
            </TouchableOpacity>
          </View>
          <Text style={localStyles.score}>{(callData.empathy_score * 20).toFixed(1)}%   </Text>
        </View>
        <TouchableOpacity onPress={() => toggleSection('empathy')}>
          <Progress.Bar progress={(callData.empathy_score || 0) / 5} width={300} color={getBarColor(callData.empathy_score)} />
        </TouchableOpacity>

        {expandedSection['empathy'] && formattedBreakdown.empathy && (
          <View style={localStyles.breakdownContainer}>
            <Text style={localStyles.subHeader}>Bad Words Detected:</Text>
            {formattedBreakdown.empathy.negative_words && formattedBreakdown.empathy.negative_words.length > 0 ? (
              formattedBreakdown.empathy.negative_words.map((word, idx) => (
                <View key={idx} style={localStyles.matchRow}>
                  <Text style={localStyles.matchReason}>• "{word}"</Text>
                </View>
              ))
            ) : (
              <Text style={localStyles.noIssuesText}>No Bad words detected.</Text>
            )}
          </View>
        )}
        {expandedSection['empathy'] && formattedBreakdown.empathy && (
          <View style={localStyles.breakdownContainer}>
            <Text style={localStyles.subHeader}>Good Words Detected:</Text>
            {formattedBreakdown.empathy.good_words && formattedBreakdown.empathy.good_words.length > 0 ? (
              formattedBreakdown.empathy.good_words.map((word, idx) => (
                <View key={idx} style={localStyles.matchRow}>
                  <Text style={localStyles.matchReason}>• "{word}"</Text>
                </View>
              ))
            ) : (
              <Text style={localStyles.noIssuesText}>No Good words detected.</Text>
            )}
          </View>
        )}
        {expandedSection['empathy'] && formattedBreakdown.empathy && (
          <View style={localStyles.breakdownContainer}>
            <Text style={localStyles.subHeader}>Very Bad Words Detected:</Text>
            {formattedBreakdown.empathy.very_bad_words && formattedBreakdown.empathy.very_bad_words.length > 0 ? (
              formattedBreakdown.empathy.very_bad_words.map((word, idx) => (
                <View key={idx} style={localStyles.matchRow}>
                  <Text style={localStyles.matchReason}>• "{word}"</Text>
                </View>
              ))
            ) : (
              <Text style={localStyles.noIssuesText}>No very Bad words detected.</Text>
            )}
          </View>
        )}

      </View>

      <View style={localStyles.scoreContainer}>
        <View style={localStyles.rowLabel}>
          <View style={localStyles.labelWithCheckbox}>
            <CheckBox
              disabled={false}
              value={includeClosing}
              onValueChange={(newValue) => setIncludeClosing(newValue)}
            />
            <TouchableOpacity onPress={() => toggleSection('closing')}>
              <Text style={localStyles.label}>Closing      </Text>
            </TouchableOpacity>
          </View>
          <Text style={localStyles.score}>{(callData.closing_score * 20).toFixed(1)}%   </Text>
        </View>
        <TouchableOpacity onPress={() => toggleSection('closing')}>
          <Progress.Bar progress={(callData.closing_score || 0) / 5} width={300} color={getBarColor(callData.closing_score)} />
        </TouchableOpacity>

        {expandedSection['closing'] && formattedBreakdown.closing && (
          <View style={localStyles.breakdownContainer}>
            {['Politeness', 'Clarity', 'Context', 'Completeness'].map((metric) => (
              <View key={metric} style={localStyles.subScoreRow}>
                <Text style={localStyles.subScoreLabel}>{metric}</Text>
                <View style={localStyles.subScoreRight}>
                  <Progress.Bar
                    progress={(formattedBreakdown.closing[metric] || 0) / 5}
                    width={150}
                    height={8}
                    color={getBarColor(formattedBreakdown.closing[metric] || 0)}
                  />
                  <Text style={localStyles.subScoreValue}>
                    {formattedBreakdown.closing[metric] || 0}/5
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ marginTop: 15 }}>
        <Text style={localStyles.label}>REMARKS</Text>
        <View style={localStyles.remarkCard}>
          <Text>{callData.remarks}</Text>
        </View>
      </View>

      <View style={localStyles.overallBox}>
        <Text style={localStyles.overallTitle}>Overall Score       </Text>

        <View style={{ alignItems: 'center' }}>
          <Text style={localStyles.subTitle}>Original</Text>
          <Text style={[localStyles.overallScore, { color: getBarColor(originalScore) }]}>
            {(originalScore * 20).toFixed(1)}%
          </Text>
        </View>

        {showSimulated && (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={localStyles.subTitle}>Simulated</Text>
            <Text style={[localStyles.overallScore, { color: getBarColor(simulatedScore) }]}>
              {(simulatedScore * 20).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.btncontainer}>
        <TouchableOpacity style={styles.btn}
          onPress={() => { navigation.navigate('Transcript', { call_id: call_id }) }}

        >
          <Text style={styles.btntxt}>View Transcript</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default CallAnalysis

const localStyles = StyleSheet.create({
  container: {
    margin: 10
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
    width: "40%",
  },

  bold: {
    fontWeight: "600",
    fontSize: 14,
  },

  scoreContainer: {
    margin: 10
  },

  label: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 5
  },
  score: {
    color: 'blue',
    fontSize: 16,
    fontWeight: '600'
  },
  rowLabel: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,

  },

  labelWithCheckbox: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  overallBox: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    marginVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  overallTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 0
  },
  overallScore: {
    fontSize: 32,
    fontWeight: '700'
  },

  remarkCard: {
    margin: 5,
    backgroundColor: '#f8f8f8',
    padding: 20,
    marginVertical: 15,
    borderRadius: 12,

  },
  breakdownContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  subScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subScoreLabel: {
    fontSize: 14,
    color: '#333',
    width: 100,
  },
  subScoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subScoreValue: {
    fontSize: 12,
    marginLeft: 10,
    width: 30,
  },
  subHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
  },
  matchRow: {
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4
  },
  matchText: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic'
  },
  matchReason: {
    fontSize: 11,
    color: 'red',
    marginTop: 2
  },
  noIssuesText: {
    fontSize: 12,
    color: 'green',
    fontStyle: 'italic'
  }

})  
