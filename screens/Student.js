import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';

import * as Location from 'expo-location';
import BrandButton from '../components/BrandButton';
import UniversalMapdup from '../components/UniversalMapdup';
import { fetchStudentMarkers, fetchBusLocation, updateStudentAttendance, getStudentAttendance } from '../components/markers';


export default function Student({ navigation, route }) {
  const { user } = route.params || {};
  const studentId = user?.uniqueId;

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [studentMarkers, setStudentMarkers] = useState([]);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [busLocationError, setBusLocationError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation(pos.coords),
          (err) => setErrorMsg(err.message),
          { enableHighAccuracy: true }
        );
      }, 1000); 
      return () => clearInterval(interval);
    } else {
      let subscription;
      const startTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (locUpdate) => setLocation(locUpdate.coords)
        );
      };
      startTracking();
      return () => {
        if (subscription) subscription.remove();
      };
    }
  }, []);


  useEffect(() => {
    if (studentId) {
      loadStudentMarkers();
      const interval = setInterval(() => {
        loadStudentMarkers();
        loadAttendanceStatus();
        if (driverId) {
          loadBusLocation(driverId);
        }
      }, 30000); 

      return () => clearInterval(interval);
    }
  }, [studentId, driverId]);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setTimeout(() => {
        if (studentId) {
          loadStudentMarkers();
        }
      }, 100);
    });
    return unsubscribe;
  }, [navigation, studentId]);

  const loadStudentMarkers = async () => {
    if (!studentId) return;
    setIsLoadingMarkers(true);
    try {
      const data = await fetchStudentMarkers(studentId);
      setStudentMarkers(data.markers || []);

      if (data.markers && data.markers.length > 0) {
        const foundDriverId = await findDriverForStudent(studentId);
        if (foundDriverId) {
          setDriverId(foundDriverId);
          loadBusLocation(foundDriverId);
          loadAttendanceStatus();
        }
      }
    } catch (error) {
      console.error('Error loading student markers:', error);
    } finally {
      setIsLoadingMarkers(false);
    }
  };

  const findDriverForStudent = async (studentId) => {
    try {
      const SERVER_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.200:3000';
      for (let i = 1; i <= 10; i++) {
        const driverId = `D${String(i).padStart(3, '0')}`;
        const res = await fetch(`${SERVER_URL}/api/markers/${driverId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.markers && data.markers.some(marker => marker.studentId === studentId)) {
            return driverId;
          }
        }
      }
    } catch (error) {
      console.error('Error finding driver for student:', error);
    }
    return null;
  };

  const loadBusLocation = async (driverId) => {
    try {
      const data = await fetchBusLocation(driverId);
      if (data.success && data.location) {
        setBusLocation(data.location);
        setBusLocationError(null);
      } else {
        setBusLocation(null);
        setBusLocationError('Bus location not available. Driver needs to send location first.');
      }
    } catch (error) {
      console.error('Error loading bus location:', error);
      setBusLocation(null);
      setBusLocationError('Unable to fetch bus location. Please check your connection.');
    }
  };

  const loadAttendanceStatus = async () => {
    try {
      const data = await getStudentAttendance(studentId);
      setAttendanceStatus(data.attendance);
    } catch (error) {
      console.error('Error loading attendance status:', error);
      setAttendanceStatus(null);
    }
  };

  const updateAttendance = async (status) => {
    try {
      const result = await updateStudentAttendance(studentId, status);
      if (result.success) {
        setAttendanceStatus(status);
        Alert.alert('Success', `Attendance updated to ${status}`);
      } else {
        Alert.alert('Error', 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', 'Failed to update attendance');
    }
  };







  const region = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5E2C8" }} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={Platform.select({ ios: require('../assets/logoApple.png'), default: require('../assets/logo192.png') })}
        />
        <Text style={styles.title}>SkoolBus Transit</Text>

        {studentMarkers.length > 0 ? (
          <View style={styles.mapWrapper}>
            {region ? (
            <UniversalMapdup
              region={region}
              studentMarkers={studentMarkers}
              busLocation={busLocation}
              mode="student"
            />
            ) : (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#145C9E" />
                <Text style={styles.text}>Fetching your location...</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.text}>
            {isLoadingMarkers ? 'Loading your assigned location...' : 'No assigned location found. Please contact your bus driver.'}
          </Text>
        )}



        {location ? (
          <Text style={styles.text}>
            Your Current Location:{'\n'}
            Latitude: {location.latitude.toFixed(6)}{'\n'}
            Longitude: {location.longitude.toFixed(6)}{'\n'}
            Accuracy: {location.accuracy} meters
          </Text>
        ) : (
          <Text style={styles.text}>{errorMsg || 'Fetching location...'}</Text>
        )}

        {busLocationError && (
          <Text style={[styles.text, { color: 'red', marginTop: 10 }]}>
            {busLocationError}
          </Text>
        )}
        {busLocation && (
          <Text style={[styles.text, {marginTop: 10 }]}>
            Bus Location: Lat: {busLocation.latitude.toFixed(6)} | Lng: {busLocation.longitude.toFixed(6)}
          </Text>
        )}

        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>Will you be on the bus today?</Text>
          <View style={styles.attendanceButtons}>
            <BrandButton
              title="Present"
              onPress={() => updateAttendance('present')}
              disabled={attendanceStatus === 'present'}
            />
            <BrandButton
              title="Absent"
              onPress={() => updateAttendance('absent')}
              disabled={attendanceStatus === 'absent'}
            />
          </View>
          {attendanceStatus && (
            <Text style={[styles.text, { marginTop: 10, fontWeight: 'bold' }]}>
              Current Status: {attendanceStatus === 'present' ? 'Present' : 'Absent'}
            </Text>
          )}
        </View>

        <BrandButton title="Sign Out" onPress={() => navigation.navigate('Home')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5E2C8',
    minHeight: '100%',
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  mapWrapper: {
    width: '100%',
    height: 400,
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#171D1C', 
    marginBottom: 20 
  },
  text: { 
    fontSize: 16, 
    marginBottom: 20, 
    color: '#171D1C', 
    textAlign: 'center' 
  },
  button: { 
    backgroundColor: '#5B3E96', 
    paddingVertical: 12, 
    paddingHorizontal: 25, 
    borderRadius: 12, 
    marginVertical: 10 
  },
  buttonText: {
    color: '#171D1C',
    fontSize: 18,
    fontWeight: '600'
   },
  attendanceSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171D1C',
    marginBottom: 15,
    textAlign: 'center',
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
});
