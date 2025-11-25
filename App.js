import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Platform, Modal, Alert} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';


import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import Student from './screens/Student';
import SignUp from './screens/SignUp';

import BusDriver from './screens/BusDriver';
import Admin from './screens/Admin';
import BrandButton from './components/BrandButton';
 
const Stack = createNativeStackNavigator();

const GlobalHomeButton = () =>{
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.homeButton}
      onPress={() => navigation.navigate("Home")}
    >
      <Ionicons name="home" size={30} color="#2867a8" />
    </TouchableOpacity>
  );
}

const MenuModal = ({ visible, onClose, navigation, currentRoute }) => {
  const nav = useNavigation();

  if (currentRoute !== 'Home') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Menu</Text>

          <BrandButton
            title="Log In"
            onPress={() => {
              onClose();
              nav.navigate("Login");
            }}
          />

          <View style={{ height: 15 }} />

          <BrandButton
            title="Sign Up"
            onPress={() => {
              onClose();
              nav.navigate("Sign Up");
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function App({}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Home');

  const headerLeft = ()=>{
    if(Platform.OS=='web'){
      return(<Text style={[styles.headerTitle, {paddingLeft:35, fontSize:30}]}>SkoolBus Transit</Text>);
}else{
      return(<TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={30} color="#2867a8" />
        </TouchableOpacity>);
}};

  const headerCenter =(routeName)=>{
    if(Platform.OS=='web'){
      return(null);
    }else{
      const screenTitles = {
        'Home': 'Home',
        'Login': 'Login',
        'Sign Up': 'Sign Up',
        'Bus': 'Bus Driver',
        'Route': 'Bus Route',
        'Admin': 'Admin',
        'Student': 'Student'
      };
      return(<Text style={styles.headerTitle}>{screenTitles[routeName] || routeName}</Text>);
    }
  }
  const headerRight =()=>{
    if(Platform.OS=='web'){
      return(<Image source={require('./assets/logo192.png')} style={styles.appIcon2}/>)
    }else{
      return (<Image source={require('./assets/logo192.png')} style={styles.appIcon}/>);
    }
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (state && state.routes && state.routes.length > 0) {
          setCurrentRoute(state.routes[state.index].name);
        }
      }}
    >
        <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute={currentRoute}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#141414', height: 85 },
          headerTitleAlign: 'center',
          headerTransparent:false,
          headerTintColor: '#2867a8',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (<GlobalHomeButton/>),
          headerRight:()=>headerRight(),
          headerBackground: () =>(<View style={styles.headerBackground}></View>),
          headerShadowVisible: false
        }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{headerBackVisible: false, gestureEnabled: false, headerLeft:()=>headerLeft(), headerTitle:()=>headerCenter('Home')}}/>
        <Stack.Screen name="Login" component={LoginScreen} options={{headerBackVisible: false, gestureEnabled: true, headerLeft: () => (<GlobalHomeButton/>), headerTitle:()=>headerCenter('Login')}} />
        <Stack.Screen name="Sign Up" component={SignUp} options={{headerBackVisible: false, gestureEnabled: true, headerLeft: () => (<GlobalHomeButton/>), headerTitle:()=>headerCenter('Sign Up')}} />
        <Stack.Screen name="Bus" component={BusDriver} options={{headerBackVisible: false, gestureEnabled: false, headerLeft:()=>headerLeft(), headerTitle:()=>headerCenter('Bus')}}/>
        <Stack.Screen name="Admin" component={Admin} options={{headerBackVisible: false, gestureEnabled: false, headerLeft:()=>headerLeft(), headerTitle:()=>headerCenter('Admin')}}/>
        <Stack.Screen name="Student" component={Student} options={{headerBackVisible: false, headerStyle:{backgroundColor: '#141414', height:100}, gestureEnabled: false, headerLeft:()=>headerLeft(), headerTitle:()=>headerCenter('Student')}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  headerBackground: {
    flex: 1,
    backgroundColor: "rgba(14, 14, 14, 0.9)",
    boxShadow: Platform.OS === 'web' ? '0px 6px 10px rgba(0, 0, 0, 0.8)' : undefined,
    shadowColor: Platform.OS === 'web' ? undefined : "#000",
    shadowOffset: Platform.OS === 'web' ? undefined : { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'web' ? undefined : 0.8,
    shadowRadius: Platform.OS === 'web' ? undefined : 10,
    elevation: Platform.OS === 'web' ? undefined : 12,
  },
  headerTitle: {
    color:'#2867a8',
    fontWeight: 'bold',
    fontSize:20,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  homeButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingLeft: Platform.select({ ios: 0, default: 35 })
  },
  appIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'transparent',
  },
  appIcon2: {
    width: 70,
    height: 70,
    marginRight:35,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F5E2C8',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#145C9E',
  },
});
