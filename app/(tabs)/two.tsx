import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// FIX: This path must go up two levels to find the file in your root folder
import { db } from '../../firebaseConfig';

const RATE_PER_MILE = 0.67;
const GOOGLE_MAPS_API_KEY = "AIzaSyAz-gl-odw9YBia7R4nJxURd5pWioFdvhc";

interface Stop {
  id: number;
  address: string;
  miles: string;
}

export default function MileageScreen() {
  const [stops, setStops] = useState<Stop[]>([{ id: Date.now(), address: '', miles: '0' }]);
  
  const updateStop = (id: number, field: keyof Stop, value: string) => 
    setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
    
  const addStop = () => setStops([...stops, { id: Date.now(), address: '', miles: '' }]);

  const fetchDistance = async (index: number) => {
    const origin = stops[index - 1].address;
    const destination = stops[index].address;
    if (!origin || !destination) return Alert.alert("Error", "Enter addresses first.");

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.rows[0].elements[0].status === "OK") {
        const numericMiles = parseFloat(data.rows[0].elements[0].distance.text.replace(/[^0-9.]/g, ''));
        updateStop(stops[index].id, 'miles', numericMiles.toString());
      }
    } catch (e) { Alert.alert("Error", "Maps API failed."); }
  };

  const totalMiles = stops.reduce((sum, s) => sum + parseFloat(s.miles || "0"), 0);

  const saveHistory = async () => {
    try {
      await addDoc(collection(db, "mileageLogs"), {
        stops,
        totalMiles,
        timestamp: new Date()
      });
      Alert.alert("Saved", "Route history saved!");
    } catch (error) {
      Alert.alert("Error", "Could not save to database.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1419' }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 20 }}>Mileage Tracker</Text>
          
          {stops.map((stop, index) => (
            <View key={stop.id} style={{ backgroundColor: '#1e272e', padding: 15, borderRadius: 10, marginBottom: 15, zIndex: stops.length - index }}>
              <Text style={{ color: '#888', marginBottom: 5 }}>{index === 0 ? "Starting Point" : `Stop ${index}`}</Text>
              
              <GooglePlacesAutocomplete
                placeholder='Search Location...'
                onPress={(data) => updateStop(stop.id, 'address', data.description)}
                query={{ 
                  key: GOOGLE_MAPS_API_KEY, 
                  language: 'en',
                  // Ensures it works with the Restricted Key you set up
                  types: 'geocode' 
                }}
                enablePoweredByContainer={false}
                styles={{ 
                  textInput: { backgroundColor: '#333', color: '#fff', borderRadius: 8 }, 
                  listView: { backgroundColor: '#333', position: 'absolute', top: 45, zIndex: 1000 } 
                }}
              />

              {index > 0 && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TextInput 
                    style={{ backgroundColor: '#333', color: '#fff', flex: 1, padding: 10, borderRadius: 8 }} 
                    placeholder="Miles" 
                    value={stop.miles} 
                    keyboardType="numeric" 
                    onChangeText={v => updateStop(stop.id, 'miles', v)} 
                  />
                  <TouchableOpacity style={{ backgroundColor: '#3498db', padding: 10, borderRadius: 8, justifyContent: 'center' }} onPress={() => fetchDistance(index)}>
                    <Ionicons name="map" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={{ backgroundColor: '#2f3542', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={addStop}>
            <Text style={{ color: '#fff' }}>+ Add Stop</Text>
          </TouchableOpacity>

          <View style={{ backgroundColor: '#3498db', padding: 20, borderRadius: 10, marginTop: 20 }}>
            <Text style={{ color: '#fff', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>Total: {totalMiles.toFixed(1)} Miles</Text>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Payout: ${(totalMiles * RATE_PER_MILE).toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={{ backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 }} onPress={saveHistory}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>💾 Save Route to History</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}