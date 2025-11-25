import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet, ActivityIndicator, Text, Alert, TextInput, Modal, Button, ScrollView } from "react-native";
import BrandButton from "./BrandButton";
import {Ionicons} from '@expo/vector-icons';
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
console.log('GOOGLE_KEY available:', !!GOOGLE_KEY);

let MapViewComponent = null;
let MarkerComponent = null;

export default function UniversalMapdup({ region, studentMarkers = [], busLocation, onMapPress, mode = 'driver', routeCoordinates = [] }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      (async () => {
        try {
          const { default: MapView, Marker } = await import("react-native-maps");
          MapViewComponent = MapView;
          MarkerComponent = Marker;
          setIsReady(true);
        } catch (err) {
          console.error("Failed to load native map:", err);
        }
      })();
    } else {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, styles.wrapper]}>
        <ActivityIndicator size="large" color="#145C9E" />
      </View>
    );
  }

  return Platform.OS === "web" ? (
    <WebMap
      region={region}
      studentMarkers={studentMarkers}
      busLocation={busLocation}
      onMapPress={onMapPress}
      mode={mode}
      routeCoordinates={routeCoordinates}
    />
  ) : (
    <NativeMap
      region={region}
      studentMarkers={studentMarkers}
      busLocation={busLocation}
      onMapPress={onMapPress}
      mode={mode}
      routeCoordinates={routeCoordinates}
    />
  );
}

function NativeMap({
    region,
    studentMarkers,
    busLocation,
    onMapPress,
    mode,
    routeCoordinates,
  }) {
    if (!MapViewComponent || !region) return (
      <View style={[styles.loadingContainer, styles.wrapper]}>
        <ActivityIndicator size="large" color="#145C9E" />
      </View>
    );
  
    const MapView = MapViewComponent;
    const Marker = MarkerComponent;
    const mapRef = useRef(null);


    const isDriver = mode === 'driver';

    const centerMap = () => {
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...region,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    };

    const handleMapPress = (e) => {
      if (isDriver && onMapPress) {
        onMapPress(e.nativeEvent.coordinate);
      }
    };
  
    return (
      <View style={styles.wrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider="google"
          mapType="satellite"
          initialRegion={{
            ...region,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {mode === 'driver' ? (
            <Marker coordinate={region} title="Bus Location">
              <View
                style={{
                  backgroundColor: "rgba(14, 14, 14, 0.9)",
                  padding: 6,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Ionicons name="bus" size={30} color="#145C9E" />
              </View>
            </Marker>
          ) : (
      
            <Marker coordinate={region} title="Your Current Location">
              <View
                style={{
                  backgroundColor: "rgba(14, 14, 14, 0.9)",
                  padding: 6,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Ionicons name="person" size={30} color="#145C9E" />
              </View>
            </Marker>
          )}

          {studentMarkers.map((marker, i) => (
            <Marker
              key={marker.id || i}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.name || `Student ${i + 1}`}
              description={marker.studentId ? `ID: ${marker.studentId}` : ''}
            >
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Ionicons name="location" size={28} color="#83dadd" />
              </View>
            </Marker>
          ))}

    
          {mode === 'student' && busLocation && (
            <Marker
              coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}
              title="Bus Location"
              description="Live bus location"
            >
              <View
                style={{
                  backgroundColor: "rgba(14, 14, 14, 0.9)",
                  padding: 6,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Ionicons name="bus" size={30} color="#145C9E" />
              </View>
            </Marker>
          )}


          {mode === 'route' && studentMarkers.length > 1 && (
            <>
              {console.log('Rendering route lines with', studentMarkers.length, 'markers')}

              {studentMarkers.slice(1).map((marker, index) => {
                const prevMarker = index === 0 ? region : studentMarkers[index];
                return (
                  <MapView.Polyline
                    key={`route-${index}`}
                    coordinates={[
                      { latitude: prevMarker.latitude || prevMarker.lat, longitude: prevMarker.longitude || prevMarker.lng },
                      { latitude: marker.latitude, longitude: marker.longitude }
                    ]}
                    strokeColor="#145C9E"
                    strokeWidth={4}
                  />
                );
              })}
            </>
          )}
        </MapView>
        <BrandButton title="Center" onPress={centerMap} />
      </View>
    );
  }
  


function WebMap({ region, studentMarkers, busLocation, onMapPress, mode, routeCoordinates }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const infoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Only show interactive elements for driver mode
    const isDriver = mode === 'driver';

    useEffect(() => {
      if (!region) return;

      const initMap = () => {
        if (!mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: region.latitude, lng: region.longitude },
          zoom: 15,
          disableDefaultUI: true,
          mapTypeId: "satellite",
        });

        // Only add click listener for driver mode
        if (isDriver && onMapPress) {
          map.addListener("click", (e) => {
            onMapPress({ latitude: e.latLng.lat(), longitude: e.latLng.lng() });
          });
        }

        mapRef.current.mapInstance = map;
        setIsLoaded(true);
      };

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initMap();
      } else {
        // Load Google Maps script if not already loaded
        if (!document.querySelector("#google-maps-script")) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            // Wait a bit for Google Maps to fully initialize
            setTimeout(initMap, 100);
          };
          document.head.appendChild(script);
        } else {
          // Script is loading, wait for it
          const checkGoogle = () => {
            if (window.google && window.google.maps) {
              initMap();
            } else {
              setTimeout(checkGoogle, 100);
            }
          };
          checkGoogle();
        }
      }
    }, [region]);

    // Center map
    const centerMap = () => {
      if (mapRef.current?.mapInstance) {
        mapRef.current.mapInstance.panTo({ lat: region.latitude, lng: region.longitude });
      }
    };

    // Render markers
    useEffect(() => {
      if (!isLoaded) return;

      // Clear previous markers
      if (mapRef.current.markers) {
        mapRef.current.markers.forEach(m => m.setMap(null));
      }
      mapRef.current.markers = [];

      // Main marker - bus for driver, student location for student
      if (mode === 'driver') {
        const busMarker = new window.google.maps.Marker({
          position: { lat: region.latitude, lng: region.longitude },
          map: mapRef.current.mapInstance,
          title: "Bus Location",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="36" height="36" rx="8" fill="#145C9E" stroke="#fff" stroke-width="2"/>
                <text x="20" y="24" text-anchor="middle" fill="#fff" font-family="Arial" font-size="12" font-weight="bold">BUS</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          }
        });
        mapRef.current.markers.push(busMarker);
      } else {
        // Student mode: current location marker with person icon
        const currentLocationMarker = new window.google.maps.Marker({
          position: { lat: region.latitude, lng: region.longitude },
          map: mapRef.current.mapInstance,
          title: "Your Current Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#FF6B6B",
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: "#fff",
            scale: 10
          }
        });
        mapRef.current.markers.push(currentLocationMarker);
      }

      studentMarkers.forEach((marker, i) => {
        const m = new window.google.maps.Marker({
          position: { lat: marker.latitude, lng: marker.longitude },
          map: mapRef.current.mapInstance,
          title: marker.name || `Student ${i + 1}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#FF0000",
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: "#fff",
            scale: 8
          }
        });
        mapRef.current.markers.push(m);
      });

      // Add bus location marker for student mode
      if (mode === 'student' && busLocation) {
        const busMarker = new window.google.maps.Marker({
          position: { lat: busLocation.latitude, lng: busLocation.longitude },
          map: mapRef.current.mapInstance,
          title: "Bus Location",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="36" height="36" rx="8" fill="#145C9E" stroke="#fff" stroke-width="2"/>
                <text x="20" y="24" text-anchor="middle" fill="#fff" font-family="Arial" font-size="12" font-weight="bold">BUS</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          }
        });
        mapRef.current.markers.push(busMarker);
      }

      // Draw route lines for route mode (straight lines, no Google API)
      if (mode === 'route' && studentMarkers.length > 1) {
        console.log('Drawing web route lines with', studentMarkers.length, 'markers');

        // Clear previous polylines
        if (mapRef.current.polylines) {
          mapRef.current.polylines.forEach(p => p.setMap(null));
        }
        mapRef.current.polylines = [];

        // Draw straight lines between consecutive points
        studentMarkers.slice(1).forEach((marker, index) => {
          const prevMarker = index === 0 ? region : studentMarkers[index];
          const polyline = new window.google.maps.Polyline({
            path: [
              { lat: prevMarker.latitude || prevMarker.lat, lng: prevMarker.longitude || prevMarker.lng },
              { lat: marker.latitude, lng: marker.longitude }
            ],
            geodesic: true,
            strokeColor: "#145C9E",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          polyline.setMap(mapRef.current.mapInstance);
          mapRef.current.polylines.push(polyline);
        });
      }
    }, [isLoaded, studentMarkers, mode]);

    if (!isLoaded) {
      return (
        <View style={[styles.loadingContainer, styles.wrapper]}>
          <ActivityIndicator size="large" color="#145C9E" />
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        <BrandButton title="Center" onPress={centerMap} />
      </View>
    );
  }


const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 25,
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#145C9E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#145C9E",
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
