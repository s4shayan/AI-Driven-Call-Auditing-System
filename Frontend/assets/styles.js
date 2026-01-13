import { StyleSheet } from "react-native";

export default StyleSheet.create({
     container: {
    flex: 1,
    justifyContent: 'center',
    alignItems:'center'

  },
  txt: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold'
  },

  subtxt: {
    margin:40,
    textAlign: 'center',

  },

  btn:{
    width:180,
    height:50,
    borderRadius:10,
    backgroundColor:'#6366F1',
    margin:10
  },

  btntxt:{
    color:'white',
    textAlign:'center',
    paddingTop:12,
    fontSize:15
    
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    height: 50,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    margin:50
  },

  input:{
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  btncontainer:
  {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    margin:50
  },


})