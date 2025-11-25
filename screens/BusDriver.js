import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import UniversalMapdup from "../components/UniversalMapdup"; 
import { fetchMarkers, updateMarkers, getStudentAttendance } from "../components/markers";
import BrandButton from "../components/BrandButton";

export default function BusDriver({ navigation, route }) {
  const { user } = route.params || {};
  const driverId = user?.uniqueId;

  const [region, setRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [markers, setMarkers] = useState([]); 
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});


  useEffect(() => {
    let locationSubscription = null;

    (async () => {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const newRegion = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
              setRegion(newRegion);

            },
            (err) => setErrorMsg(err.message)
          );


          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              const newRegion = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
              setRegion(newRegion);

            },
            (err) => setErrorMsg(err.message),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
          );


          return () => navigator.geolocation.clearWatch(watchId);
        } else {
          setErrorMsg("Geolocation not supported");
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission denied to access location.");
          return;
        }


        let loc = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);



        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, 
            distanceInterval: 10, 
          },
          (locUpdate) => {
            const newRegion = {
              latitude: locUpdate.coords.latitude,
              longitude: locUpdate.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            };
            setRegion(newRegion);

          }
        );
      }
    })();


    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [driverId]);


  const sendLocationToServer = async (latitude, longitude) => {
    if (!driverId) return;

    try {
      const SERVER_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.1.200:3000';
      const response = await fetch(`${SERVER_URL}/api/bus-location/${driverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send location to server');
        Alert.alert('Error', 'Failed to send location to server');
      } else {
        Alert.alert('Success', 'Bus location sent to database!');
      }
    } catch (error) {
      console.error('Error sending location:', error);
      Alert.alert('Error', 'Failed to send location');
    }
  };


  useEffect(() => {
    if (driverId) {
      loadMarkers();
    }
  }, [driverId]);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {

      setTimeout(() => {
        if (driverId) {
          loadMarkers();
        }
      }, 100);
    });
    return unsubscribe;
  }, [navigation, driverId]);


  useEffect(() => {
    if (driverId) {
      const interval = setInterval(() => {
        loadMarkers();
        loadAttendanceData();
      }, 30000); 

      return () => clearInterval(interval);
    }
  }, [driverId]);

  const loadMarkers = async () => {
    if (!driverId) return;
    try {
      const data = await fetchMarkers(driverId);
      if (data && data.length > 0) {
        setMarkers(data);
      }
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  };



  const loadAttendanceData = async () => {
    if (!markers.length) return;

    const attendancePromises = markers.map(async (marker) => {
      try {
        const attendance = await getStudentAttendance(marker.studentId);
        return { studentId: marker.studentId, attendance: attendance.attendance };
      } catch (error) {
        console.error(`Error loading attendance for ${marker.studentId}:`, error);
        return { studentId: marker.studentId, attendance: 'unknown' };
      }
    });

    const attendanceResults = await Promise.all(attendancePromises);
    const attendanceMap = {};
    attendanceResults.forEach(result => {
      attendanceMap[result.studentId] = result.attendance;
    });
    setAttendanceData(attendanceMap);
  };


  const handleMapPress = (coordinate) => {
    if (Platform.OS === 'web') {

      const input = window.prompt("New Student Stop\nEnter student name and ID (format: Name,ID):");
      if (input && input.includes(',')) {
        const [name, studentId] = input.split(',').map(s => s.trim());
        if (name && studentId) {
          const newMarker = {
            id: Date.now().toString(),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            name: name,
            studentId: studentId,
          };
          setMarkers((prev) => [...prev, newMarker]);
          Alert.alert("Stop Added", `${name} (ID: ${studentId}) has been added!`);
        } else {
          Alert.alert("Invalid Format", "Both name and ID are required");
        }
      } else if (input) {
        Alert.alert("Invalid Format", "Please enter in format: Name,ID");
      }
    } else {
      Alert.prompt(
        "New Student Stop",
        "Enter student name and ID (format: Name,ID):",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Stop",
            onPress: (input) => {
              if (!input || !input.includes(',')) {
                Alert.alert("Invalid Format", "Please enter in format: Name,ID");
                return;
              }
              const [name, studentId] = input.split(',').map(s => s.trim());
              if (!name || !studentId) {
                Alert.alert("Invalid Format", "Both name and ID are required");
                return;
              }

              const newMarker = {
                id: Date.now().toString(),
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                name: name,
                studentId: studentId,
              };
              setMarkers((prev) => [...prev, newMarker]);
              Alert.alert("Stop Added", `${name} (ID: ${studentId}) has been added!`);
            },
          },
        ],
        "plain-text"
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5E2C8" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { marginTop: 10 }]}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Tap anywhere on the map to mark and name a student's pickup/drop-off location.
      </Text>

      <View style={{ alignText: "center", marginTop:20}}>
        <Text style={styles.sectionTitle}>Map View</Text>
      </View>

      <View style={styles.mapWrapper}>
        {errorMsg ? (
          <Text style={styles.text}>{errorMsg}</Text>
        ) : region ? (
            <UniversalMapdup
              region={region}
              studentMarkers={markers} 
              onMapPress={handleMapPress} 
              mode="driver"
            />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#145C9E" />
            <Text style={styles.text}>Fetching your location to center the map...</Text>
          </View>
        )}
      </View>
      {region && (
        <Text style={[styles.listItem, { textAlign: "center", marginTop: 10 }]}>
          Your Location: Lat: {region.latitude.toFixed(6)} | Lng: {region.longitude.toFixed(6)}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <BrandButton
          title="Save Markers & Send Location"
          onPress={async () => {
            if (!driverId) return;

            try {

              const markersResult = await updateMarkers(driverId, markers);
              if (!markersResult.success) {
                Alert.alert("Error", "Failed to save markers");
                return;
              }


              if (region) {
                await sendLocationToServer(region.latitude, region.longitude);
              } else {
                Alert.alert('Error', 'Location not available yet');
                return;
              }


              await loadAttendanceData();

              Alert.alert("Success", "Markers and location saved to database!");
            } catch (error) {
              console.error("Error saving markers and location:", error);
              Alert.alert("Error", "Failed to save markers and location");
            }
          }}
          disabled={isLoadingMarkers}
        />
      </View>


      {markers.length > 0 && (
        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>Student Attendance</Text>
          {markers.map((marker) => (
            <View key={marker.id} style={styles.attendanceItem}>
              <Text style={styles.attendanceText}>
                {marker.name} (ID: {marker.studentId})
              </Text>
              <Text style={[
                styles.attendanceStatus,
                attendanceData[marker.studentId] === 'present' && styles.presentStatus,
                attendanceData[marker.studentId] === 'absent' && styles.absentStatus,
                attendanceData[marker.studentId] === 'unknown' && styles.unknownStatus
              ]}>
                {attendanceData[marker.studentId] || 'Loading...'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <BrandButton title="Sign Out" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5E2C8",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#145C9E",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#867a8c",
    marginBottom: 25,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#171D1C",
    marginBottom: 10,
    alignSelf: "center",
  },
  listItem: {
    fontSize: 16,
    color: "#867a8c",
    marginBottom: 6,
  },
  text: {
    fontSize: 18,
    color: "#171D1C",
    marginBottom: 20,
    textAlign: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  mapWrapper: {
    width: "100%",
    height: 400,
    marginVertical: 20,
    borderRadius: 10,
    overflow: "hidden",

  },
  buttonContainer: {
    margin: 10,
  },
  attendanceSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171D1C',
    flex: 1,
  },
  attendanceStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    textAlign: 'center',
    minWidth: 70,
  },
  presentStatus: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  absentStatus: {
    backgroundColor: '#F8D7DA',
    color: '#721C24',
  },
  unknownStatus: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
});
