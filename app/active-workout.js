import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Minus, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ActiveWorkout() {
  const router = useRouter();
  const { workoutType, workoutTitle } = useLocalSearchParams();

  const workoutStats = {
    legs: { name: 'Squat', totalSteps: 4, kcal: 450, duration: 45 },
    chest: { name: 'Bench Press', totalSteps: 5, kcal: 350, duration: 40 },
    hiit: { name: 'Burpees', totalSteps: 6, kcal: 500, duration: 30 },
    back: { name: 'Lat Pulldown', totalSteps: 4, kcal: 400, duration: 50 },
    arms: { name: 'Biceps Curl', totalSteps: 4, kcal: 250, duration: 35 },
    abs: { name: 'Plank', totalSteps: 3, kcal: 150, duration: 20 },
  };

  const currentStats = workoutStats[workoutType] || { name: 'Genel Egzersiz', totalSteps: 1, kcal: 150, duration: 20 };

  const [weight, setWeight] = useState(60);
  const [completedSets, setCompletedSets] = useState([]);

  const toggleSet = (id) => {
    if (completedSets.includes(id)) {
      setCompletedSets(completedSets.filter(item => item !== id));
    } else {
      setCompletedSets([...completedSets, id]);
    }
  };

  // --- GÜNCELLENEN ANTRENMAN BİTİRME MANTIĞI ---
  const handleFinishWorkout = async () => {
    try {
      // 1. Antrenman Geçmişini Güncelle
      const savedHistory = await AsyncStorage.getItem('workout_history');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      const newEntry = {
        id: Date.now().toString(),
        type: workoutType || 'genel',
        title: workoutTitle || 'Genel Antrenman',
        kcal: currentStats.kcal,
        duration: currentStats.duration,
        date: new Date().toLocaleDateString('tr-TR')
      };
      await AsyncStorage.setItem('workout_history', JSON.stringify([newEntry, ...history]));

      // 2. Ana Sayfa İstatistiklerini Güncelle (Kritik Nokta)
      const savedStats = await AsyncStorage.getItem('user_stats');
      
      // Eğer veri yoksa (yeni kullanıcı), her şeyi 0'dan başlat
      let userStats = savedStats ? JSON.parse(savedStats) : { kcal: 0, streak: 0, workouts: 0 };
      
      const newStats = {
        kcal: (Number(userStats.kcal) || 0) + currentStats.kcal, // Üzerine ekle
        workouts: (Number(userStats.workouts) || 0) + 1,
        streak: (Number(userStats.streak) || 0) + 1,
        lastWorkoutDate: new Date().toDateString()
      };

      await AsyncStorage.setItem('user_stats', JSON.stringify(newStats));

      Alert.alert(
        "Tebrikler!", 
        `Antrenman başarıyla tamamlandı.\n🔥 ${currentStats.kcal} kcal yakıldı.`,
        [{ text: "Tamam", onPress: () => router.replace('/(tabs)') }]
      );

    } catch (e) {
      console.log("Kaydetme hatası:", e);
      Alert.alert("Hata", "Veriler güncellenirken bir sorun oluştu.");
    }
  };

  const totalSets = 5;
  const allDone = completedSets.length === totalSets;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.workoutTitle}>{workoutTitle || "Antrenman"}</Text>
          <Text style={styles.exerciseStep}>Hedef: {currentStats.kcal} kcal • {currentStats.duration} dk</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#94a3b8" size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <Text style={styles.exerciseName}>{currentStats.name}</Text>
          
          <View style={styles.weightSelector}>
            <TouchableOpacity onPress={() => setWeight(Math.max(0, weight - 5))} style={styles.circleBtn}>
              <Minus color="#fff" size={24} />
            </TouchableOpacity>
            <View style={{alignItems: 'center'}}>
              <Text style={styles.weightValue}>{weight}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            <TouchableOpacity onPress={() => setWeight(weight + 5)} style={styles.circleBtn}>
              <Plus color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          {[1, 2, 3, 4, 5].map((set) => {
            const isDone = completedSets.includes(set);
            return (
              <TouchableOpacity 
                key={set} 
                onPress={() => toggleSet(set)}
                activeOpacity={0.7}
                style={[styles.setRow, isDone && styles.setRowDone]}
              >
                <Text style={[styles.setText, isDone && styles.textDone]}>Set {set}</Text>
                <View style={styles.repsContainer}>
                    <Text style={[styles.repsText, isDone && styles.textDone]}>
                    {weight} kg x 10 tekrar
                    </Text>
                    {isDone && <CheckCircle2 color="#a855f7" size={18} style={{marginLeft: 8}} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.nextBtn, allDone && styles.nextBtnActive]} 
            onPress={() => {
              if(allDone) {
                handleFinishWorkout();
              } else {
                Alert.alert("Antrenman Tamamlanmadı", "Bitirmek için tüm setleri işaretlemelisin.");
              }
            }}
        >
            <Text style={[styles.nextBtnText, allDone && styles.nextBtnTextActive]}>
            {allDone ? "Antrenmanı Bitir ve Kaydet" : "Tüm Setleri Tamamla"}
            </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  workoutTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  exerciseStep: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  scrollContent: { paddingBottom: 150 },
  mainCard: { backgroundColor: '#0f172a', margin: 20, borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1e293b' },
  exerciseName: { color: '#fff', fontSize: 26, textAlign: 'center', marginBottom: 30, fontWeight: '700' },
  weightSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 40 },
  circleBtn: { backgroundColor: '#1e293b', width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  weightValue: { color: '#fff', fontSize: 56, fontWeight: 'bold' },
  weightUnit: { color: '#94a3b8', fontSize: 16 },
  setRow: { backgroundColor: '#020617', flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  setRowDone: { borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.05)' },
  setText: { color: '#94a3b8', fontSize: 15 },
  repsContainer: { flexDirection: 'row', alignItems: 'center' },
  repsText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  textDone: { color: '#a855f7' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: '#1e293b' },
  nextBtn: { backgroundColor: '#0f172a', padding: 20, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  nextBtnActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  nextBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 18 },
  nextBtnTextActive: { color: '#fff' }
});