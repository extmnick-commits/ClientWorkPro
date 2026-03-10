import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { db } from '../../firebaseConfig';

const TARGET_HOURS = 100;

export default function HoursScreen() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Time States
  const [startTime, setStartTime] = useState('');
  const [startAMPM, setStartAMPM] = useState('AM');
  const [endTime, setEndTime] = useState('');
  const [endAMPM, setEndAMPM] = useState('PM');

  const [workLogs, setWorkLogs] = useState<any>({});
  const [monthlyTotal, setMonthlyTotal] = useState(0);

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

  // NEW: "Tough" Time Calculation
  const calculateHours = () => {
    const parse = (timeStr: string, period: string) => {
      // Clean the string of anything that isn't a number or colon
      const cleanTime = timeStr.replace(/[^0-9:]/g, '');
      if (!cleanTime.includes(':')) return null;

      let [hours, minutes] = cleanTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;
      
      // Convert to 24-hour math
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours + (minutes / 60);
    };

    const startVal = parse(startTime, startAMPM);
    const endVal = parse(endTime, endAMPM);

    if (startVal === null || endVal === null) return null;
    
    let diff = endVal - startVal;
    if (diff < 0) diff += 24; // Handles night shifts
    return diff;
  };

  const saveShift = async () => {
    const total = calculateHours();

    if (total === null || total <= 0) {
      return Alert.alert("Format Error", "Please type time as 9:00 or 12:30");
    }

    try {
      // Direct call to Firebase
      await addDoc(collection(db, "workLogs"), {
        date: selectedDate,
        hours: parseFloat(total.toFixed(2)),
        timestamp: new Date()
      });
      
      setModalVisible(false);
      setStartTime('');
      setEndTime('');
      Alert.alert("Success!", `Logged ${total.toFixed(2)} hours for ${selectedDate}`);
    } catch (error) {
      Alert.alert("Error", "Check your internet and Firebase setup.");
    }
  };

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hours Tracker</Text>
        <Switch value={isDark} onValueChange={setIsDark} />
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
            <Text style={styles.modalTitle}>New Entry: {selectedDate}</Text>
            
            <Text style={styles.label}>Start Time</Text>
            <View style={styles.timeRow}>
              <TextInput style={styles.inputMain} placeholder="9:00" placeholderTextColor="#999" value={startTime} onChangeText={setStartTime} keyboardType="numeric" />
              <TouchableOpacity style={[styles.ampmBtn, startAMPM === 'AM' && styles.activeAM]} onPress={() => setStartAMPM('AM')}><Text style={styles.btnText}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ampmBtn, startAMPM === 'PM' && styles.activePM]} onPress={() => setStartAMPM('PM')}><Text style={styles.btnText}>PM</Text></TouchableOpacity>
            </View>

            <Text style={styles.label}>End Time</Text>
            <View style={styles.timeRow}>
              <TextInput style={styles.inputMain} placeholder="5:00" placeholderTextColor="#999" value={endTime} onChangeText={setEndTime} keyboardType="numeric" />
              <TouchableOpacity style={[styles.ampmBtn, endAMPM === 'AM' && styles.activeAM]} onPress={() => setEndAMPM('AM')}><Text style={styles.btnText}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ampmBtn, endAMPM === 'PM' && styles.activePM]} onPress={() => setEndAMPM('PM')}><Text style={styles.btnText}>PM</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveShift}>
              <Text style={styles.saveBtnText}>Save Shift</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#0f1419' : '#f5f6fa' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#1e272e' : '#fff', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: isDark ? '#fff' : '#2c3e50' },
  statRow: { padding: 20 },
  statBox: { backgroundColor: isDark ? '#1e272e' : '#fff', color: isDark ? '#fff' : '#2c3e50', padding: 15, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20 },
  modalContent: { backgroundColor: isDark ? '#1e272e' : '#fff', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: isDark ? '#fff' : '#000', textAlign: 'center' },
  label: { color: '#888', marginBottom: 5, fontSize: 12, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  inputMain: { backgroundColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000', flex: 1, padding: 15, borderRadius: 10, fontSize: 18 },
  ampmBtn: { backgroundColor: '#444', padding: 15, borderRadius: 10, width: 60, alignItems: 'center' },
  activeAM: { backgroundColor: '#3498db' },
  activePM: { backgroundColor: '#e67e22' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2ecc71', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  cancelText: { textAlign: 'center', marginTop: 20, color: '#ff4757', fontWeight: 'bold' }
});