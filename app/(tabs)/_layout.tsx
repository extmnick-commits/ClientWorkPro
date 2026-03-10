import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3498db', headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Hours', tabBarIcon: ({ color }) => <Ionicons name="time" size={28} color={color} /> }} />
      <Tabs.Screen name="two" options={{ title: 'Mileage', tabBarIcon: ({ color }) => <Ionicons name="car" size={28} color={color} /> }} />
    </Tabs>
  );
}