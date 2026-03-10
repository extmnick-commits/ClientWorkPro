import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
// This path goes up twice to find your config in the root
import { db } from '../../firebaseConfig';

const TARGET_HOURS = 100;

export default function HoursScreen() {
  const [isDark, setIsDark] = useState(true);
  const styles = getStyles(isDark);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workLogs, setWorkLogs] = useState<any>({});
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // Load existing logs from Firebase
  useEffect(() => {
    const q = query(collection(db, "workLogs"), orderBy("date"));
    return onSnapshot(q, (snapshot) => {
      let total = 0;
      const logs: any = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.hours;
        logs[data.date] = { marked: true, dotColor: '#2ecc71' };
      });
      setWorkLogs(logs);
      setMonthlyTotal(total);
    });
  }, []);

  const calculateHours = (start: string, end: string): string => {
    const toDec = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h + (m / 60);
    };
    if (!start || !end) return "0";
    const diff = toDec(end) - toDec(start);
    return diff > 0 ? diff.toFixed(2) : "0";
  };

  const saveShift = async () => {
    if (!startTime || !endTime) {
      return Alert.alert("Error", "Please enter both start and end times.");
    }
    const hours = parseFloat(calculateHours(startTime, endTime));
    try {
      await addDoc(collection(db, "workLogs"), {
        date: selectedDate, 
        hours, 
        timestamp: new Date()
      });
      setModalVisible(false);
      setStartTime('');
      setEndTime('');
      Alert.alert("Success", "Shift logged!");
    } catch (e) {
      Alert.alert("Error", "Could not save to database.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hours Tracker</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
           <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#fff" : "#000"} />
           <Switch value={isDark} onValueChange={setIsDark} />
        </View>
      </View>
      
      <Calendar 
        onDayPress={(day: any) => { setSelectedDate(day.dateString); setModalVisible(true); }}
        markedDates={{...workLogs, [selectedDate]: {selected: true, selectedColor: '#3498db'}}}
        theme={{
          calendarBackground: isDark ? '#1e272e' : '#fff',
          textSectionTitleColor: isDark ? '#fff' : '#2c3e50',
          dayTextColor: isDark ? '#fff' : '#2c3e50',
          todayTextColor: '#3498db',
          monthTextColor: isDark ? '#fff' : '#2c3e50',
          arrowColor: '#3498db',
        }}
      />
      
      <View style={styles.statRow}>
        <Text style={styles.statBox}>Goal: {monthlyTotal.toFixed(1)} / {TARGET_HOURS} hrs</Text>
      </View>
      
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Hours for {selectedDate}</Text>
            <TextInput style={styles.input} placeholder="Start (09:00)" placeholderTextColor="#999" value={startTime} onChangeText={setStartTime} />
            <TextInput style={styles.input} placeholder="End (17:00)" placeholderTextColor="#999" value={endTime} onChangeText={setEndTime} />
            <TouchableOpacity style={styles.btnSave} onPress={saveShift}>
              <Text style={styles.btnText}>Save Shift</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{textAlign:'center', marginTop:15, color:'#ff4757'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#0f1419' : '#f5f6fa' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#1e272e' : '#fff', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: isDark ? '#fff' : '#2c3e50' },
  statRow: { padding: 20 },
  statBox: { backgroundColor: isDark ? '#1e272e' : '#fff', color: isDark ? '#fff' : '#000', padding: 15, borderRadius: 10, textAlign: 'center', fontWeight: 'bold', borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
  input: { backgroundColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000', padding: 12, borderRadius: 8, marginBottom: 10 },
  btnSave: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20 },
  modalContent: { backgroundColor: isDark ? '#1e272e' : '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: isDark ? '#fff' : '#333' }
});