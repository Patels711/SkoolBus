import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, ScrollView, TextInput, Button, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import BrandButton from '../components/BrandButton';
import { useNavigation } from '@react-navigation/native'; 

export default function SignUp() {

  const navigation = useNavigation();


  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleAccountSelection = (accountType) => {
    setUsername('');
    setPassword('');
    setEmail('');
    setSelectedAccountType(accountType);
  };
  

  const handleSignUpSubmit = async () => {
        console.log(username, password, email);
      if (!username || !password || !email) {
          Alert.alert("Missing Information", "Please fill in all fields to sign up.");
          return;
      }
      
      setIsLoading(true);
      const getApiUrl = () => {
        if (Platform.OS === 'web') {
          return 'http://localhost:3000/api/signup';
        } else {
          return 'http://192.168.1.200:3000/api/signup';
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
                  email,
                  accountType: selectedAccountType
              }),
          });

          const data = await response.json();

          if (data.success) {
              Alert.alert("Success", data.message);
              navigation.navigate('Login');
          } else {
              if (data.message && data.message.includes("Username already exists")) {
                  Alert.alert(
                      "Username Taken",
                      "This username is already taken. Please try a different username.",
                      [
                          { text: "Try Again", style: "default" }
                      ]
                  );
              } else {
                  Alert.alert("Sign Up Failed", data.message || "Failed to create account. Please try again.");
              }
          }

      } catch (error) {
          // Handle connection errors
          console.error("Sign Up API Error:", error);
          Alert.alert("Connection Error", "Could not connect to the transit server. Is the Node.js server running?");
      } finally {
          // Stop loading regardless of success or failure
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

        <Text style={styles.formTitle}>{selectedAccountType} Sign Up</Text>
        <Text style={styles.formSubtitle}>
            Enter your information to create your account.
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
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
        />
        
        {isLoading ? (
            <ActivityIndicator size="large" color="#145C9E" style={{ marginVertical: 20 }} />
        ) : (
            <View style={styles.submitButton}>
                <BrandButton
                    title={`Sign Up as ${selectedAccountType}`}
                    onPress={handleSignUpSubmit}
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
                setEmail('');
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
                <Text style={styles.subtitle}>Select the account type to sign up</Text>
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
