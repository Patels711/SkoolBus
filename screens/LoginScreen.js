import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, ScrollView, TextInput, Button, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import BrandButton from '../components/BrandButton';
import { useNavigation } from '@react-navigation/native'; 

export default function LoginScreen() {

  const navigation = useNavigation();


  const [selectedAccountType, setSelectedAccountType] = useState(null); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [uniqueId, setUniqueId] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 


  const handleAccountSelection = (accountType) => {

    setUsername('');
    setPassword('');
    setUniqueId('');
    setSelectedAccountType(accountType); 
  };
  

  const handleLoginSubmit = async () => {
        console.log(username,password,uniqueId);
      if (!username || !password || !uniqueId) {
          Alert.alert("Missing Information", "Please fill in all fields to log in.");
          return;
      }
      

      if ((selectedAccountType === 'Bus Driver' || selectedAccountType === 'Student') && Platform.OS === 'web') {
        Alert.alert("Platform Restriction", "Tracking features require iOS or Android. Please use your device.");
        
        return;
      }

      setIsLoading(true); 


      const getApiUrl = () => {
        if (Platform.OS === 'web') {
          return 'http://localhost:3000/api/login';
        } else {
          return 'http://192.168.1.200:3000/api/login';
        }
      };

      const API_URL = getApiUrl();

      try {
          const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  username,
                  password,
                  uniqueId, 
                  accountType: selectedAccountType 
              }),
          });

          const data = await response.json();
          
          if (data.success) {
              Alert.alert("Success", data.message);

              if (selectedAccountType === 'Bus Driver') {
                  navigation.navigate('Bus', { user: data.user });
              } if(selectedAccountType === 'Admin') {
                  navigation.navigate('Admin', { user: data.user });
              } if (selectedAccountType === 'Student') {
                  navigation.navigate('Student', { user: data.user });
              }
          } else {

              Alert.alert("Login Failed", data.message || "Invalid credentials. Please try again.");
          }

      } catch (error) {

          console.error("Login API Error:", error);
          Alert.alert("Connection Error", "Could not connect to the transit server. Is the Node.js server running?");
      } finally {

          setIsLoading(false); 
      }
  }

  const getUniqueFieldLabel = () => {
    if (selectedAccountType === 'Bus Driver') return 'Driver ID';
    if (selectedAccountType === 'Admin') return 'Security Code';
    if (selectedAccountType === 'Student') return 'Student ID';
  };
  

  const FormChange = (
    <KeyboardAvoidingView style={styles.loginFormContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>

        <Text style={styles.formTitle}>{selectedAccountType} Login</Text> 
        <Text style={styles.formSubtitle}>
            Please log in with your credentials.
        </Text>
        
        <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            keyboardType="default"
        />

        <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
        
        <TextInput
            style={styles.input}
            placeholder={`Enter ${getUniqueFieldLabel()}`}
            value={uniqueId}
            onChangeText={setUniqueId}
        />
        
        {isLoading ? (
            <ActivityIndicator size="large" color="#145C9E" style={{ marginVertical: 20 }} />
        ) : (
            <View style={styles.submitButton}>
                <BrandButton 
                    title={`Log In as ${selectedAccountType}`} 
                    onPress={handleLoginSubmit} 
                    disabled={isLoading}
                />
            </View>
        )}
        
        <Button 
            title="← Change Account Type" 
            onPress={() => {
                setSelectedAccountType(null); 
                setUsername('');
                setPassword('');
                setUniqueId('');
            }} 
            color="#867a8c"
        />
    </KeyboardAvoidingView>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5E2C8" }} contentContainerStyle={styles.container}>
        <Image
            source={Platform.select({ ios: require("../assets/logoApple.png"), default: require("../assets/logo192.png") })}
         />
         <Text style={styles.title}>SkoolBus Transit</Text>
        

        {selectedAccountType === null ? (

            <View style={styles.selectionView}>
                <Text style={styles.subtitle}>Select the account type</Text>
                <View style={styles.buttonLayout}>
                    <View style={styles.buttonWrapper}>

                        <BrandButton title="Bus Driver 🚌"  onPress={() => handleAccountSelection('Bus Driver')}/>
                    </View>
                    <View style={styles.buttonWrapper}>
                        <BrandButton title="Student 👤"  onPress={() => handleAccountSelection('Student')} />
                    </View >
                    <View style={styles.buttonWrapper}> 
                        <BrandButton title="Admin ⚙️ " onPress={() => handleAccountSelection('Admin')} />
                    </View>
                </View>
            </View>
         ) : ( 

             FormChange
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', 
    padding: 45, 
    backgroundColor: '#F5E2C8',
    minHeight: '100%',
  }, 
  selectionView: {
      width: '100%',
      alignItems: 'center',
  },
  buttonLayout:{
    flexDirection: Platform.select({ios: 'column', android:'column', web:'row'}),
    justifyContent: 'space-evenly',
    alignItems:'center',
    width: '100%',
    padding:10,
  },
  title: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#145C9E', 
    marginBottom: 15, 
    textAlign: 'center', 
  },
  buttonWrapper: { 
    marginHorizontal: Platform.select({ ios: 5, default: 15 }),
    flex: 1, 
    minWidth:  Platform.select({ ios: 100, default: 90 }),
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500', 
    color: '#867a8c', 
    marginBottom: 25, 
    textAlign: 'center' 
  },
  loginFormContainer: {
    width: '100%',
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#145C9E',
      marginBottom: 5,
      textAlign: 'center',
  },
  formSubtitle: {
      fontSize: 16,
      color: '#867a8c',
      marginBottom: 20,
      textAlign: 'center',
  },
  input: {
      backgroundColor: 'rgba(14, 14, 14, 0.9)',
      height: 50,
      borderColor: '#145C9E',
      borderWidth: 2,
      borderRadius: 15,
      paddingHorizontal: 15,
      marginBottom: 15,
      color:'#867a8c'
  },
  submitButton: {
      marginTop: 10,
      marginBottom: 20,
  }
});
