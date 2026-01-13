import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { BASE_URL } from './BaseIP'

const Agents = ({navigation}) => {
    const[agents,setAgents]=useState([])

    useEffect(()=>{
        fetchAgents();
    },[])

    const fetchAgents=async()=>{
        try{   
            const response=await fetch(`${BASE_URL}/agents/`);

            const agentData=await response.json();
            setAgents(agentData);
        }
        catch(error)
        {
            console.log("Error Fetching Data",error)
        }
    }

    const renderItem=({item})=>(
        <View style={localStyles.card}>
            <View>
                <Text style={{fontWeight:'bold'}}>{item.agent_name}</Text>
                <Text style={{color:'#6e71f1ff'}}>{item.agent_code}</Text>
            </View>
            <View style={localStyles.btncontainer}>
                <TouchableOpacity style={localStyles.btn}
                    onPress={()=>{navigation.navigate('AgentReport',
                        {
                            agent_id:item.agent_id,
                            agent_code:item.agent_code,
                            agent_name:item.agent_name

                        })}}
                
                >
                    <Text style={localStyles.btntxt}>Details</Text>
                </TouchableOpacity>
            </View>


        </View>

    )


  return (
    <View style={localStyles.container}>
        <FlatList
            data={agents}
            keyExtractor={(item)=>item.agent_id.toString()}
            renderItem={renderItem}
        />
    </View>
  )
}

const localStyles=StyleSheet.create({
    
    container:{
        justifyContent:'center',
        alignItems:'center'

     },
    
    card:{
        flexDirection:'row',
        width:350,
        height:70,
        borderRadius:10,
        backgroundColor:'#e3e6e5ff',
        margin:10,
        justifyContent:'space-between',
        padding:10,
        alignItems:'center'
  },

    btntxt:{
        color:'white',
        textAlign:'center',
        
  },

    btn:{
        width:80,
        height:25,
        borderRadius:5,
        backgroundColor:'#6366F1',
  },
    btncontainer:{
        justifyContent:'center',
        alignItems:'center',
       
  },


})

export default Agents