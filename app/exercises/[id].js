import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Award, CheckCircle2, ChevronLeft,
    Play,
    Square,
    X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert, FlatList,
    Image,
    Modal, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- VERİTABANI ---
const EXERCISE_DATABASE = {
    'chest-shoulder': [
        { id: '1', name: 'Bench Press', sets: '4 Set', reps: '12 Tekrar', kcal: '120', time: 120, image: 'https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg', instruction: 'Barı omuz genişliğinde kavrayın. Göğsünüze yavaşça indirin.' },
        { id: '2', name: 'Shoulder Press', sets: '3 Set', reps: '10 Tekrar', kcal: '90', time: 90, image: 'https://images.pexels.com/photos/4162485/pexels-photo-4162485.jpeg', instruction: 'Dambılları kulak hizasında tutun. Yukarı basın.' },
    ],
    'back': [
        { id: 'b1', name: 'Lat Pulldown', sets: '4 Set', reps: '12 Tekrar', kcal: '95', time: 120, image: 'https://images.pexels.com/photos/3839179/pexels-photo-3839179.jpeg', instruction: 'Barı göğsünüze çekin.' },
        { id: 'b2', name: 'Seated Row', sets: '3 Set', reps: '12 Tekrar', kcal: '85', time: 90, image: 'https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg', instruction: 'Ağırlığı karnınıza doğru çekin.' },
    ],
    'arms': [
        { id: 'a1', name: 'Bicep Curl', sets: '3 Set', reps: '15 Tekrar', kcal: '70', time: 60, image: 'https://images.pexels.com/photos/4325451/pexels-photo-4325451.jpeg', instruction: 'Ağırlığı kontrollü yukarı kaldırın.' },
        { id: 'a2', name: 'Tricep Pushdown', sets: '3 Set', reps: '12 Tekrar', kcal: '65', time: 60, image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg', instruction: 'Barı aşağı iterek arka kolu sıkın.' }
    ],
    'legs': [
        { id: 'l1', name: 'Leg Press', sets: '4 Set', reps: '12 Tekrar', kcal: '140', time: 100, image: 'https://images.pexels.com/photos/3761701/pexels-photo-3761701.jpeg', instruction: 'Platformu kontrollü itin.' },
        { id: 'l2', name: 'Squat', sets: '3 Set', reps: '15 Tekrar', kcal: '150', time: 120, image: 'https://images.pexels.com/photos/3912953/pexels-photo-3912953.jpeg', instruction: 'Çömelin ve topuklardan güç alın.' }
    ],
    'abs': [
        { id: 'ab1', name: 'Plank', sets: '3 Set', reps: '60 Saniye', kcal: '50', time: 60, image: 'https://images.pexels.com/photos/3761701/pexels-photo-3761701.jpeg', instruction: 'Vücudu düz tutun.' },
        { id: 'ab2', name: 'Crunch', sets: '4 Set', reps: '20 Tekrar', kcal: '40', time: 45, image: 'https://images.pexels.com/photos/4325451/pexels-photo-4325451.jpeg', instruction: 'Üst sırtı yerden kaldırın.' }
    ]
};

export default function ExerciseDetailScreen() {
    const { id, categoryTitle } = useLocalSearchParams();
    const router = useRouter();

    // ID eşleşmesi için temizleme
    const cleanId = id?.toString().toLowerCase();
    const exercises = EXERCISE_DATABASE[cleanId] || [];

    const [selectedExercise, setSelectedExercise] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0 && isTimerRunning) {
            handleComplete(activeTimer);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const handleComplete = async (exerciseId) => {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        const burnedKcal = parseInt(exercise.kcal) || 0;

        if (!completedExercises.includes(exerciseId)) {
            setCompletedExercises(prev => [...prev, exerciseId]);
            
            try {
                // GEÇMİŞİ KAYDET (Progress sayfasında görünecek)
                const savedHistory = await AsyncStorage.getItem('workout_history');
                let history = savedHistory ? JSON.parse(savedHistory) : [];

                const newRecord = {
                    id: Date.now().toString(),
                    title: exercise.name,
                    kcal: burnedKcal,
                    date: new Date().toLocaleDateString('tr-TR'),
                    category: categoryTitle
                };

                history.unshift(newRecord);
                await AsyncStorage.setItem('workout_history', JSON.stringify(history));

                // TOPLAM İSTATİSTİKLERİ GÜNCELLE
                const savedStats = await AsyncStorage.getItem('user_stats');
                let stats = savedStats ? JSON.parse(savedStats) : { kcal: 0, count: 0 };
                stats.kcal = (Number(stats.kcal) || 0) + burnedKcal;
                stats.count = (Number(stats.count) || 0) + 1;
                await AsyncStorage.setItem('user_stats', JSON.stringify(stats));

            } catch (error) {
                console.log("Kayıt hatası:", error);
            }
        }

        setIsTimerRunning(false);
        setActiveTimer(null);
        
        Alert.alert(
            "Mükemmel! 🔥", 
            `${exercise.name} tamamlandı. İlerlemene bakmak ister misin?`,
            [
                { text: "Devam Et", style: "cancel" },
                { text: "İlerlemeyi Gör", onPress: () => router.push("/progress") }
            ]
        );
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>{categoryTitle || 'Egzersizler'}</Text>
                    <Text style={styles.headerSub}>{completedExercises.length}/{exercises.length} Bitti</Text>
                </View>
                <Award color="#f59e0b" size={24} />
            </View>

            <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => {
                    const isCompleted = completedExercises.includes(item.id);
                    const isActive = activeTimer === item.id;

                    return (
                        <TouchableOpacity 
                            onPress={() => { setSelectedExercise(item); setModalVisible(true); setImgLoading(true); }}
                            activeOpacity={0.7}
                            style={[styles.exerciseCard, isActive && styles.activeCard, isCompleted && styles.completedCard]}
                        >
                            <View style={[styles.iconBox, isCompleted && { backgroundColor: '#10b981' }]}>
                                {isCompleted ? <CheckCircle2 color="#fff" size={24} /> : <Play color={isActive ? "#fff" : "#8b5cf6"} size={20} fill={isActive ? "#fff" : "#8b5cf6"} />}
                            </View>

                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={[styles.exerciseName, isCompleted && styles.completedText]}>{item.name}</Text>
                                {isActive ? (
                                    <Text style={styles.timerTextActive}>{formatTime(timeLeft)}</Text>
                                ) : (
                                    <Text style={styles.statTextSmall}>{item.sets} x {item.reps}</Text>
                                )}
                            </View>

                            {isActive && (
                                <TouchableOpacity onPress={() => { setIsTimerRunning(false); setActiveTimer(null); }} style={styles.stopBtn}>
                                    <Square color="#fff" size={16} fill="#fff" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>İçerik yüklenemedi (ID: {cleanId})</Text>}
            />

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#fff" size={28} /></TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.imageContainer}>
                                {imgLoading && <ActivityIndicator style={styles.loader} color="#8b5cf6" size="large" />}
                                <Image source={{ uri: selectedExercise?.image }} style={styles.exerciseImage} onLoadEnd={() => setImgLoading(false)}/>
                            </View>

                            <Text style={styles.modalLabel}>TALİMATLAR</Text>
                            <Text style={styles.instructionText}>{selectedExercise?.instruction}</Text>
                            
                            <View style={styles.modalStatsGrid}>
                                <View style={styles.mStat}><Text style={styles.mVal}>{selectedExercise?.time}s</Text><Text style={styles.mLab}>Süre</Text></View>
                                <View style={styles.mStat}><Text style={styles.mVal}>{selectedExercise?.kcal}</Text><Text style={styles.mLab}>Kcal</Text></View>
                            </View>
                            
                            <TouchableOpacity style={styles.readyBtn} onPress={() => {
                                setModalVisible(false);
                                setActiveTimer(selectedExercise.id);
                                setTimeLeft(selectedExercise.time);
                                setIsTimerRunning(true);
                            }}>
                                <Text style={styles.readyBtnText}>BAŞLAT</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { backgroundColor: '#1e293b', padding: 10, borderRadius: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerSub: { color: '#8b5cf6', fontSize: 12, fontWeight: 'bold' },
    exerciseCard: { backgroundColor: '#1e293b', padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    activeCard: { backgroundColor: '#8b5cf6' },
    completedCard: { opacity: 0.5 },
    iconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    exerciseName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    completedText: { textDecorationLine: 'line-through', color: '#64748b' },
    statTextSmall: { color: '#64748b', fontSize: 13, marginTop: 4 },
    timerTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginTop: 4 },
    stopBtn: { backgroundColor: '#ef4444', padding: 12, borderRadius: 15 },
    emptyText: { color: '#64748b', textAlign: 'center', marginTop: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    imageContainer: { width: '100%', height: 250, borderRadius: 25, overflow: 'hidden', marginBottom: 20, backgroundColor: '#0f172a' },
    exerciseImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    loader: { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 1 },
    modalLabel: { color: '#8b5cf6', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    instructionText: { color: '#cbd5e1', fontSize: 15, lineHeight: 24, marginBottom: 20 },
    modalStatsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    mStat: { flex: 1, backgroundColor: '#0f172a', padding: 15, borderRadius: 20, alignItems: 'center' },
    mVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    mLab: { color: '#64748b', fontSize: 12 },
    readyBtn: { backgroundColor: '#8b5cf6', padding: 20, borderRadius: 22, alignItems: 'center', marginBottom: 20 },
    readyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});