import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet, ActivityIndicator, Text } from "react-native";
import BrandButton from "./BrandButton";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

let MapViewComponent = null;
let MarkerComponent = null;

export default function UniversalMaps({ region }) {
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

  return Platform.OS === "web" ? <WebMap region={region} /> : <NativeMap region={region} />;
}

function WebMap({ region }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const infoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

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

      const marker = new window.google.maps.Marker({
        position: { lat: region.latitude, lng: region.longitude },
        map,
        title: "Bus Location",
        icon: {
          url: "https://placehold.co/40x40/145C9E/ffffff?text=BUS",
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: "<div>Bus Location</div>",
      });

      marker.addListener("click", () => infoWindow.open(map, marker));
      infoWindow.open(map, marker); // auto-open

      mapRef.current.mapInstance = map;
      markerRef.current = marker;
      infoRef.current = infoWindow;
      setIsLoaded(true);
    };


    if (window.google && window.google.maps) {
      initMap();
    } else {

      if (!document.querySelector("#google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {

          setTimeout(() => {
            try {
              initMap();
            } catch (err) {
              console.error("Error initializing map:", err);
              setError("Failed to load Google Maps");
            }
          }, 500);
        };
        script.onerror = () => {
          console.error("Failed to load Google Maps script");
          setError("Failed to load Google Maps script");
        };
        document.head.appendChild(script);
      } else {

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


  useEffect(() => {
    if (markerRef.current && mapRef.current?.mapInstance && region) {
      const newPos = { lat: region.latitude, lng: region.longitude };
      mapRef.current.mapInstance.panTo(newPos);
      markerRef.current.setPosition(newPos);
      infoRef.current?.open(mapRef.current.mapInstance, markerRef.current);
    }
  }, [region]);

  const centerMap = () => {
    if (mapRef.current?.mapInstance) {
      mapRef.current.mapInstance.panTo({ lat: region.latitude, lng: region.longitude });
      infoRef.current?.open(mapRef.current.mapInstance, markerRef.current);
    }
  };

  if (error) {
    return (
      <View style={[styles.loadingContainer, styles.wrapper]}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, styles.wrapper]}>
        <ActivityIndicator size="large" color="#145C9E" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading Google Maps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <div ref={mapRef} style={styles.map} />
      <BrandButton title="Center" onPress={centerMap}/>
    </View>
  );
}


function NativeMap({ region }) {
  if (!MapViewComponent || !region) return (
    <View style={[styles.loadingContainer, styles.wrapper]}>
      <ActivityIndicator size="large" color="#145C9E" />
    </View>
  );

  const MapView = MapViewComponent;
  const Marker = MarkerComponent;
  const mapRef = useRef(null);

  const centerMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
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
      >
        <Marker coordinate={region} title="Bus Location" />
      </MapView>

      <BrandButton title="Home" onPress={centerMap}/>
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
    backgroundColor: "#fff",
  },
});
