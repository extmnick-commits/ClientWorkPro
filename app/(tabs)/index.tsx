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
// Ensure this path matches your firebaseConfig location
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

  // 1. Load Data from Firebase
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

  // 2. Simplified Calculation Logic
  const calculateHours = () => {
    const parse = (timeStr: string, period: string) => {
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours)) return null;
      if (!minutes) minutes = 0;
      
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours + (minutes / 60);
    };

    const startVal = parse(startTime, startAMPM);
    const endVal = parse(endTime, endAMPM);

    if (startVal === null || endVal === null) return 0;
    return endVal - startVal;
  };

  // 3. Robust Save Function
  const saveShift = async () => {
    const hoursTotal = calculateHours();

    if (hoursTotal <= 0) {
      return Alert.alert("Invalid Time", "Please enter valid times (e.g., Start: 9:00 AM, End: 5:00 PM)");
    }

    try {
      await addDoc(collection(db, "workLogs"), {
        date: selectedDate,
        hours: parseFloat(hoursTotal.toFixed(2)),
        timestamp: new Date()
      });
      
      // Reset UI
      setModalVisible(false);
      setStartTime('');
      setEndTime('');
      Alert.alert("Success! 🎉", `Saved ${hoursTotal.toFixed(2)} hours.`);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Could not save to database. Check your connection.");
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
            <Text style={styles.modalTitle}>Log for {selectedDate}</Text>
            
            {/* Start Time Section */}
            <Text style={styles.label}>Start Time</Text>
            <View style={styles.timeRow}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="9:00" placeholderTextColor="#999" value={startTime} onChangeText={setStartTime} keyboardType="numbers-and-punctuation" />
              <TouchableOpacity style={[styles.ampmBtn, startAMPM === 'AM' && styles.ampmActive]} onPress={() => setStartAMPM('AM')}><Text style={styles.btnTextSmall}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ampmBtn, startAMPM === 'PM' && styles.ampmActive]} onPress={() => setStartAMPM('PM')}><Text style={styles.btnTextSmall}>PM</Text></TouchableOpacity>
            </View>

            {/* End Time Section */}
            <Text style={styles.label}>End Time</Text>
            <View style={styles.timeRow}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="5:00" placeholderTextColor="#999" value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" />
              <TouchableOpacity style={[styles.ampmBtn, endAMPM === 'AM' && styles.ampmActive]} onPress={() => setEndAMPM('AM')}><Text style={styles.btnTextSmall}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ampmBtn, endAMPM === 'PM' && styles.ampmActive]} onPress={() => setEndAMPM('PM')}><Text style={styles.btnTextSmall}>PM</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnSave} onPress={saveShift}>
              <Text style={styles.btnText}>Save Shift</Text>
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
  statBox: { backgroundColor: isDark ? '#1e272e' : '#fff', color: isDark ? '#fff' : '#2c3e50', padding: 15, borderRadius: 10, textAlign: 'center', fontWeight: 'bold', borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20 },
  modalContent: { backgroundColor: isDark ? '#1e272e' : '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: isDark ? '#fff' : '#000', textAlign: 'center' },
  label: { color: isDark ? '#888' : '#666', marginBottom: 5, fontSize: 12, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', gap: 5, marginBottom: 15, alignItems: 'center' },
  input: { backgroundColor: isDark ? '#333' : '#eee', color: isDark ? '#fff' : '#000', padding: 12, borderRadius: 8, height: 50 },
  ampmBtn: { backgroundColor: '#444', padding: 10, borderRadius: 8, height: 50, justifyContent: 'center', width: 50 },
  ampmActive: { backgroundColor: '#3498db' },
  btnSave: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnTextSmall: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  cancelText: { textAlign: 'center', marginTop: 15, color: '#ff4757', fontWeight: 'bold' }
});