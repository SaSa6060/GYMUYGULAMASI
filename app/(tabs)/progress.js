import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Droplets,
  Dumbbell,
  Flame,
  RotateCcw,
  Target,
  Timer,
  Zap
} from 'lucide-react-native';

export default function ProgressScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [water, setWater] = useState(0); 
    const [lastWorkouts, setLastWorkouts] = useState([]);
    const [consumedKcal, setConsumedKcal] = useState(0);

    // --- VERİLERİ YÜKLEME ---
    useFocusEffect(
        useCallback(() => {
            const loadAllData = async () => {
                try {
                    // 1. Antrenman Geçmişi (2. Dosyadaki anahtar ile eşitlendi)
                    const savedHistory = await AsyncStorage.getItem('workout_history');
                    const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];
                    setLastWorkouts(parsedHistory);

                    // 2. Su Verisi
                    const savedWater = await AsyncStorage.getItem('user_water_count');
                    setWater(savedWater ? parseInt(savedWater) : 0);

                    // 3. Beslenme/Kalori Verisi (User Stats'tan toplamı alalım)
                    const savedStats = await AsyncStorage.getItem('user_stats');
                    if (savedStats) {
                        const stats = JSON.parse(savedStats);
                        setConsumedKcal(stats.kcal || 0); // Toplam yakılanı burada gösterelim
                    }
                } catch (e) {
                    console.log("SashaFit Yükleme Hatası:", e);
                } finally {
                    setLoading(false);
                }
            };

            loadAllData();
        }, [])
    );

    const addWater = async () => {
        const newWater = water + 1;
        setWater(newWater);
        await AsyncStorage.setItem('user_water_count', newWater.toString());
    };

    const handleReset = () => {
        Alert.alert("Verileri Sıfırla", "Tüm ilerlemen silinecek. Emin misin?", [
            { text: "Vazgeç" },
            { 
              text: "Sıfırla", 
              style: "destructive", 
              onPress: async () => {
                await AsyncStorage.multiRemove(['workout_history', 'user_stats', 'user_water_count']);
                setWater(0);
                setConsumedKcal(0);
                setLastWorkouts([]);
              } 
            }
        ]);
    };

    // İstatistik Hesaplamaları
    const totalActiveKcal = lastWorkouts.reduce((sum, item) => sum + (Number(item.kcal) || 0), 0);
    // Her antrenman ortalama 5 dk sayılsın (duration verisi yoksa)
    const totalActiveTime = lastWorkouts.length * 5; 

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                <View style={styles.topBar}>
                    <View style={styles.userInfo}>
                        <View style={styles.levelBadge}>
                            <Zap color="#fff" size={22} fill="#fff" />
                        </View>
                        <View>
                            <Text style={styles.userName}>Sasha Performans</Text>
                            <Text style={styles.userStatus}>{lastWorkouts.length > 0 ? 'Harika gidiyorsun!' : 'Hadi başlayalım!'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                        <RotateCcw color="#ef4444" size={22} />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainGrid}>
                    <View style={styles.tallCard}>
                        <Flame color="#ef4444" size={32} fill="#ef4444" />
                        <View>
                            <Text style={styles.cardVal}>{totalActiveKcal}</Text>
                            <Text style={styles.cardLab}>Yakılan Kcal</Text>
                        </View>
                        <View style={styles.miniProgress}>
                            <View style={[styles.miniBar, { width: `${Math.min((totalActiveKcal / 2000) * 100, 100)}%`, backgroundColor: '#ef4444' }]} />
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.smallCard}>
                            <Target color="#a855f7" size={24} />
                            <Text style={styles.smallCardVal}>{totalActiveKcal}</Text>
                            <Text style={styles.smallCardLab}>Toplam Hedef</Text>
                        </View>

                        <TouchableOpacity style={styles.smallCard} onPress={addWater}>
                            <Droplets color="#3b82f6" size={24} />
                            <Text style={styles.smallCardVal}>{(water * 0.25).toFixed(2)}L</Text>
                            <Text style={styles.smallCardLab}>Su Ekle (+)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsStrip}>
                    <View style={styles.stripItem}>
                        <Timer color="#94a3b8" size={18} />
                        <Text style={styles.stripText}>{totalActiveTime} dk Süre</Text>
                    </View>
                    <View style={styles.stripItem}>
                        <Dumbbell color="#94a3b8" size={18} />
                        <Text style={styles.stripText}>{lastWorkouts.length} Egzersiz</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Antrenman Geçmişi</Text>
                {lastWorkouts.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Dumbbell color="#334155" size={40} />
                        <Text style={styles.emptyText}>Henüz bir egzersiz yapmadın.</Text>
                    </View>
                ) : (
                    <View style={styles.logList}>
                        {lastWorkouts.slice(0, 5).map((item, index) => (
                            <View key={index} style={styles.logItem}>
                                <View style={styles.logIcon}>
                                    <Zap color="#a855f7" size={20}/>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.logTitle}>{item.title}</Text>
                                    <Text style={styles.logTime}>{item.date} • {item.kcal} kcal</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Günlük Hedefler</Text>
                <View style={styles.goalCard}>
                    <GoalItem label="Kalori Yakımı" progress={totalActiveKcal / 2000} color="#ef4444" />
                    <GoalItem label="Su İçme" progress={water / 10} color="#3b82f6" />
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Yardımcı Bileşen
function GoalItem({ label, progress, color }) {
    const percentage = Math.min(progress * 100, 100).toFixed(0);
    return (
        <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
                <Text style={styles.goalLab}>{label}</Text>
                <Text style={[styles.goalTotal, { color: color }]}>%{percentage}</Text>
            </View>
            <View style={styles.fullBar}>
                <View style={[styles.activeBar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    levelBadge: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center' },
    userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userStatus: { color: '#64748b', fontSize: 12 },
    resetBtn: { padding: 10, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
    mainGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    tallCard: { flex: 1.2, backgroundColor: '#0f172a', padding: 20, borderRadius: 28, height: 180, justifyContent: 'space-between', borderWidth: 1, borderColor: '#1e293b' },
    rightColumn: { flex: 1, gap: 15 },
    smallCard: { backgroundColor: '#0f172a', padding: 18, borderRadius: 22, flex: 1, justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
    cardVal: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    cardLab: { color: '#64748b', fontSize: 13 },
    smallCardVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    smallCardLab: { color: '#64748b', fontSize: 11 },
    miniProgress: { height: 6, backgroundColor: '#020617', borderRadius: 3 },
    miniBar: { height: '100%', borderRadius: 3 },
    statsStrip: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0f172a', padding: 15, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#1e293b' },
    stripItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stripText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    logList: { gap: 10, marginBottom: 25 },
    logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 15, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#1e293b' },
    logIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
    logTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    logTime: { color: '#64748b', fontSize: 12 },
    emptyBox: { padding: 40, alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#1e293b' },
    emptyText: { color: '#475569', marginTop: 10 },
    goalCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#1e293b' },
    goalItem: { marginBottom: 18 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    goalLab: { color: '#fff', fontSize: 14 },
    goalTotal: { fontWeight: 'bold' },
    fullBar: { height: 8, backgroundColor: '#020617', borderRadius: 4 },
    activeBar: { height: '100%', borderRadius: 4 }
});