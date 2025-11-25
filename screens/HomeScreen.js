import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Image, ScrollView, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import BrandButton from "../components/BrandButton";
import UniversalMaps from "../components/UniversalMaps";


const logoApple = require("../assets/logoApple.png");
const logoDefault = require("../assets/logo192.png");

export default function HomeScreen({ navigation }) {
  const [region, setRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);


  async function getETA(origin, destination) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();
  
    if (data.routes && data.routes.length > 0) {
      const leg = data.routes[0].legs[0];
      return {
        durationText: leg.duration.text, 
        durationValue: leg.duration.value, 
        distanceText: leg.distance.text,
        distanceValue: leg.distance.value,
      };
    }
  
    return null;
  }
  

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => setErrorMsg(err.message)
          );
        } else {
          setErrorMsg("Geolocation not supported");
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission denied");
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5E2C8" }} contentContainerStyle={styles.container}>
      <Image
        source={Platform.OS === 'ios' ? logoApple : logoDefault}
      />
           <Text style={styles.title}>SkoolBus Transit</Text>

      <Text style={styles.subtitle}>
        Your all-in-one school bus app that tracks routes, attendance, and real-time locations to keep students, drivers, and admins informed.
      </Text>

      <Text style={styles.sectionTitle}>For Students 👤:</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Track your bus location in real-time</Text>
        <Text style={styles.listItem}>• See estimated arrival times at school and home</Text>
        <Text style={styles.listItem}>• Receive push notifications when the bus is 5 minutes away</Text>
      </View>

      <Text style={styles.sectionTitle}>For Bus Drivers 🚌:</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Set your bus routes and bus stops</Text>
        <Text style={styles.listItem}>• Manage student attendance using IDs</Text>
        <Text style={styles.listItem}>• Receive notifications for arrivals and drop-offs</Text>
        <Text style={styles.listItem}>• Navigate efficiently through your route</Text>
      </View>

      <Text style={styles.sectionTitle}>For Admins ⚙️:</Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Monitor attendance across all bus routes</Text>
        <Text style={styles.listItem}>• View all buses, drivers, and students in real-time</Text>
        <Text style={styles.listItem}>• Receive alerts when drivers complete routes or buses arrive</Text>
      </View>
    

    <View style={{alignText:"center"}}>
      <Text style={styles.sectionTitle}>Live Location Tracking Enabled</Text>
      <Text style={[styles.listItem, {textAlign:"center"}]}>Allow Location Tracking To See</Text>
    </View>

      <View style={{ width: "100%", height: 300, marginVertical: 20 }}>
        {errorMsg ? (
          <Text style={styles.text}>{errorMsg}</Text>
        ) : region ? (
          <UniversalMaps region={region} />

        ) : (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#145C9E" />
            <Text style={styles.text}>Fetching location...</Text>
          </View>
        )}
        <Text style={[styles.listItem, {textAlign:"center"}]}>{'\n'}Tap the Red Marker to see Bus location</Text>
      </View>

      {region && (
        <Text style={styles.text}>{'\n'}{'\n'}
          Latitude: {region.latitude.toFixed(6)}{'\n'}
          Longitude: {region.longitude.toFixed(6)}
        </Text>
      )}
      <Text style={styles.subtitle}>{'\n'}Log in to access your account</Text>
      <BrandButton title="Log In" onPress={() => navigation.navigate("Login")} />
      <Text style={styles.subtitle}>{'\n'}Sign up to create your account</Text>
      <BrandButton title="Sign Up" onPress={() => navigation.navigate("Sign Up")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ 
  container: {
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#F5E2C8'
  }, 
  title: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#145C9E', 
    marginBottom: 15, 
    textAlign: 'center', 
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500', 
    color: '#867a8c', 
    marginBottom: 25, 
    textAlign: 'center' },
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#171D1C', 
    marginTop: 20, 
    marginBottom: 10, 
    alignSelf: 'flex-start' }, 
  list: { 
    width: '100%', 
    marginBottom: 15 }, 
  listItem: { 
    fontSize: 18, 
    color: '#867a8c', 
    marginBottom: 6 }, 
  text: { 
    fontSize: 18, 
    color: '#171D1C', 
    marginBottom: 20, 
    textAlign: 'center' }, 
  center: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%' }, });
