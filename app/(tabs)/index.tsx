import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { db } from '../../firebaseConfig';

export default function HoursScreen() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // States for the new easy-entry system
  const [startH, setStartH] = useState('');
  const [startM, setStartM] = useState('00');
  const [startP, setStartP] = useState('AM');
  const [endH, setEndH] = useState('');
  const [endM, setEndM] = useState('00');
  const [endP, setEndP] = useState('PM');

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

  const saveShift = async () => {
    const to24 = (h: string, m: string, p: string) => {
      let hour = parseInt(h);
      let min = parseInt(m) || 0;
      if (p === 'PM' && hour < 12) hour += 12;
      if (p === 'AM' && hour === 12) hour = 0;
      return hour + (min / 60);
    };

    const start = to24(startH, startM, startP);
    const end = to24(endH, endM, endP);
    let diff = end - start;
    if (diff < 0) diff += 24;

    if (!startH || !endH) return Alert.alert("Error", "Enter hours first!");

    try {
      await addDoc(collection(db, "workLogs"), {
        date: selectedDate,
        hours: parseFloat(diff.toFixed(2)),
        timestamp: new Date()
      });
      setModalVisible(false);
      Alert.alert("Success! 🎉", `Logged ${diff.toFixed(2)} hours.`);
    } catch (e) {
      Alert.alert("Firebase Error", "Check connection.");
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
        theme={{ calendarBackground: isDark ? '#1e272e' : '#fff', dayTextColor: isDark ? '#fff' : '#000', monthTextColor: isDark ? '#fff' : '#000' }}
      />
      <View style={{padding: 20}}><Text style={styles.statBox}>Total: {monthlyTotal.toFixed(1)} / 100 hrs</Text></View>
      
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedDate}</Text>
          
          <Text style={styles.label}>Start</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="12" value={startH} onChangeText={setStartH} keyboardType="numeric" maxLength={2} />
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} placeholder="00" value={startM} onChangeText={setStartM} keyboardType="numeric" maxLength={2} />
            <TouchableOpacity style={[styles.pBtn, startP === 'AM' && styles.pActive]} onPress={() => setStartP('AM')}><Text style={styles.pText}>AM</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pBtn, startP === 'PM' && styles.pActive]} onPress={() => setStartP('PM')}><Text style={styles.pText}>PM</Text></TouchableOpacity>
          </View>

          <Text style={styles.label}>End</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="12" value={endH} onChangeText={setEndH} keyboardType="numeric" maxLength={2} />
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.input} placeholder="00" value={endM} onChangeText={setEndM} keyboardType="numeric" maxLength={2} />
            <TouchableOpacity style={[styles.pBtn, endP === 'AM' && styles.pActive]} onPress={() => setEndP('AM')}><Text style={styles.pText}>AM</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pBtn, endP === 'PM' && styles.pActive]} onPress={() => setEndP('PM')}><Text style={styles.pText}>PM</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveShift}><Text style={styles.saveBtnText}>Save Shift</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{color: '#ff4757', textAlign: 'center', marginTop: 20}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#0f1419' : '#f5f6fa' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: isDark ? '#fff' : '#000' },
  statBox: { backgroundColor: isDark ? '#1e272e' : '#fff', color: isDark ? '#fff' : '#000', padding: 20, textAlign: 'center', fontWeight: 'bold', borderRadius: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: 20 },
  modalContent: { backgroundColor: isDark ? '#1e272e' : '#fff', padding: 25, borderRadius: 20 },
  modalTitle: { color: isDark ? '#fff' : '#000', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  input: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 10, width: 60, textAlign: 'center', fontSize: 18 },
  colon: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  pBtn: { backgroundColor: '#444', padding: 15, borderRadius: 10, width: 60 },
  pActive: { backgroundColor: '#3498db' },
  pText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2ecc71', padding: 20, borderRadius: 15, marginTop: 10 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }
});