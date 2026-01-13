import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import { BASE_URL } from './BaseIP';

const SettingTab = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addRuleModalVisible, setAddRuleModalVisible] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [newKnowledge, setNewKnowledge] = useState({ content: '', category: '', source_section: '' });
  const [loading, setLoading] = useState(false);
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [agentData, setAgentData] = useState({
    agent_name: '',
    email: '',
    agent_code: ''
  });

  const handleAddRule = async () => {
    if (!newKnowledge.content || !newKnowledge.category || !newKnowledge.source_section) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/knowledge/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newKnowledge),
      });

      const json = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Rule added successfully');
        setAddRuleModalVisible(false);
        setNewKnowledge({ content: '', category: '', source_section: '' });
      } else {
        Alert.alert('Error', json.detail || 'Failed to add rule');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKnowledge = async () => {
    if (!selectedKnowledge || !selectedKnowledge.content) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/knowledge/${selectedKnowledge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: selectedKnowledge.content }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Knowledge updated successfully');
        setEditModalVisible(false);
        // Refresh knowledge list locally
        setKnowledgeData(prev => prev.map(item =>
          item.id === selectedKnowledge.id ? { ...item, content: selectedKnowledge.content } : item
        ));
      } else {
        const json = await response.json();
        Alert.alert('Error', json.detail || 'Failed to update knowledge');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while updating knowledge');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewKnowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/knowledge/`);
      const json = await response.json();
      if (response.ok) {
        setKnowledgeData(json);
        setKnowledgeModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch knowledge base.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while fetching knowledge.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadKnowledge = async () => {
    try {
      const [result] = await pick({
        type: [types.allFiles],
      });

      if (!result) return;

      setLoading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: result.uri,
        type: result.type,
        name: result.name,
      });

      const response = await fetch(`${BASE_URL}/knowledge/ingest`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const json = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert('Success', `Knowledge base ingested successfully. ${json.chunks_processed} chunks processed.`);
      } else {
        Alert.alert('Error', json.detail || 'Failed to ingest knowledge.');
      }

    } catch (err) {
      setLoading(false);
      if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error(err);
        Alert.alert('Error', 'An error occurred while picking/uploading the file.');
      }
    }
  };

  const handleCreateAgent = async () => {
    if (!agentData.agent_name || !agentData.email || !agentData.agent_code) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      const json = await response.json();
      setLoading(false);

      if (response.ok || json.status === 'success') {
        Alert.alert('Success', 'Agent created successfully.');
        setModalVisible(false);
        setAgentData({ agent_name: '', email: '', agent_code: '' });
      } else {
        Alert.alert('Error', json.detail || 'Failed to create agent.');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert('Error', 'An error occurred while creating the agent.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />}

        <View style={styles.section}>
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Image source={require('../../assets/images/password.png')} style={styles.imageIcon} resizeMode="contain" />
              <Text style={styles.itemText}>Change password</Text>
            </View>
            <Image source={require('../../assets/images/arrow.png')} style={styles.arrowIcon} resizeMode="contain" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={handleUploadKnowledge}>
            <View style={styles.itemLeft}>
              <Image source={require('../../assets/images/knowledge.png')} style={styles.imageIcon} resizeMode="contain" />
              <Text style={styles.itemText}>Add Knowledge Document</Text>
            </View>
            <Image source={require('../../assets/images/arrow.png')} style={styles.arrowIcon} resizeMode="contain" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => setAddRuleModalVisible(true)}>
            <View style={styles.itemLeft}>
              <Image source={require('../../assets/images/knowledge.png')} style={styles.imageIcon} resizeMode="contain" />
              <Text style={styles.itemText}>Add Single Rule</Text>
            </View>
            <Image source={require('../../assets/images/arrow.png')} style={styles.arrowIcon} resizeMode="contain" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={handleViewKnowledge}>
            <View style={styles.itemLeft}>
              <Image source={require('../../assets/images/knowledge.png')} style={styles.imageIcon} resizeMode="contain" />
              <Text style={styles.itemText}>View Knowledge Details</Text>
            </View>
            <Image source={require('../../assets/images/arrow.png')} style={styles.arrowIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Admin Actions</Text>
          <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => setModalVisible(true)}>
            <View style={styles.itemLeft}>
              <Image source={require('../../assets/images/knowledge.png')} style={styles.imageIcon} resizeMode="contain" />
              <Text style={styles.itemText}>Create New Agent</Text>
            </View>
            <Image source={require('../../assets/images/arrow.png')} style={styles.arrowIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

      </ScrollView>

      {/* Create Agent Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add Agent     </Text>

            <TextInput
              style={styles.input}
              placeholder="Agent Name"
              value={agentData.agent_name}
              onChangeText={(text) => setAgentData({ ...agentData, agent_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              value={agentData.email}
              onChangeText={(text) => setAgentData({ ...agentData, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Agent Code"
              value={agentData.agent_code}
              onChangeText={(text) => setAgentData({ ...agentData, agent_code: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleCreateAgent}
              >
                <Text style={styles.textStyle}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Knowledge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={knowledgeModalVisible}
        onRequestClose={() => setKnowledgeModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { height: '80%' }]}>
            <Text style={styles.modalTitle}>Knowledge Base</Text>
            <Text style={{ fontSize: 12, color: 'gray', marginBottom: 10 }}>Click on an item to edit</Text>
            {knowledgeData.length === 0 ? (
              <Text>No knowledge found.</Text>
            ) : (
              <FlatList
                data={knowledgeData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.knowledgeItem}
                    onPress={() => {
                      setSelectedKnowledge(item);
                      setEditModalVisible(true);
                    }}
                  >
                    <Text style={styles.knowledgeText} numberOfLines={3}>{item.content}</Text>
                    <View style={styles.knowledgeMeta}>
                      <Text style={styles.knowledgeLabel}>Category: {item.category}</Text>
                      <Text style={styles.knowledgeLabel}>Source: {item.source_section}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={{ width: '100%' }}
              />
            )}
            <TouchableOpacity
              style={[styles.button, styles.buttonClose, { marginTop: 15, width: '100%' }]}
              onPress={() => setKnowledgeModalVisible(false)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Add Rule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addRuleModalVisible}
        onRequestClose={() => setAddRuleModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add New Rule</Text>

            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Rule Content"
              multiline={true}
              value={newKnowledge.content}
              onChangeText={(text) => setNewKnowledge({ ...newKnowledge, content: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (e.g., Compliance, Greeting)"
              value={newKnowledge.category}
              onChangeText={(text) => setNewKnowledge({ ...newKnowledge, category: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Source Section"
              value={newKnowledge.source_section}
              onChangeText={(text) => setNewKnowledge({ ...newKnowledge, source_section: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setAddRuleModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleAddRule}
              >
                <Text style={styles.textStyle}>Add Rule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Knowledge Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Knowledge</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline={true}
              value={selectedKnowledge?.content}
              onChangeText={(text) => setSelectedKnowledge(prev => ({ ...prev, content: text }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveKnowledge}
              >
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 15,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    tintColor: '#64748B',
  },
  itemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 10,
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#334155',
  },
  input: {
    height: 40,
    borderColor: '#CBD5E1',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 8,
    color: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    width: '45%',
  },
  buttonClose: {
    backgroundColor: '#94A3B8',
  },
  buttonSave: {
    backgroundColor: '#6366F1',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  knowledgeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  knowledgeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  knowledgeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  knowledgeLabel: {
    fontSize: 12,
    color: '#888',
  },
});

export default SettingTab;