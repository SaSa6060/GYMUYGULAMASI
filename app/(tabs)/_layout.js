import { Tabs } from 'expo-router';
import { Apple, BarChart3, BookOpen, Dumbbell } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#3b82f6', 
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { 
          backgroundColor: '#1e293b', 
          borderTopColor: '#334155',
          height: 65,
          paddingBottom: 10
        } 
      }}>
      
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Antrenman', 
          tabBarIcon: ({color}) => <Dumbbell color={color} size={24}/> 
        }} 
      />

      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Beslenme', 
          tabBarIcon: ({color}) => <Apple color={color} size={24}/> 
        }} 
      />

      <Tabs.Screen 
        name="exercises" 
        options={{ 
          title: 'Egzersizler', 
          tabBarIcon: ({color}) => <BookOpen color={color} size={24}/> 
        }} 
      />

      <Tabs.Screen 
        name="progress" 
        options={{ 
          title: 'İlerleme', 
          tabBarIcon: ({color}) => <BarChart3 color={color} size={24}/> 
        }} 
      />
    </Tabs>
  );
}