import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, ChevronRight, Dumbbell, Heart, Target, Zap } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const workouts = [
  { id: '1', title: 'Sasha Bacak Serisi', duration: '45 dk', cal: '400', icon: <Zap color="#fff" size={22} fill="#fff" />, color: ['#a855f7', '#7c3aed'], type: 'legs' },
  { id: '2', title: 'Sasha Göğüs & Kol', duration: '50 dk', cal: '350', icon: <Dumbbell color="#fff" size={22} />, color: ['#a855f7', '#6366f1'], type: 'chest' },
  { id: '3', title: 'Sasha HIIT (Tüm Vücut)', duration: '30 dk', cal: '500', icon: <Heart color="#fff" size={22} fill="#fff" />, color: ['#ec4899', '#a855f7'], type: 'hiit' },
  { id: '4', title: 'Sasha Sırt & Omuz', duration: '40 dk', cal: '300', icon: <Activity color="#fff" size={22} />, color: ['#7c3aed', '#4f46e5'], type: 'back' },
];

export default function WorkoutSelection() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* SashaFit Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={{flex: 1, alignItems: 'center', marginRight: 45}}>
            <Text style={styles.headerTitle}>PROGRAM SEÇ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeBox}>
            <Target color="#a855f7" size={24} />
            <Text style={styles.sectionDesc}>
                Bugün hangi sınırını zorlayacaksın? Hedefine uygun bir <Text style={{color: '#a855f7', fontWeight: 'bold'}}>SashaFit</Text> programı seç.
            </Text>
        </View>
        
        {workouts.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => router.push({ 
                pathname: '/active-workout', 
                params: { workoutType: item.type, workoutTitle: item.title } 
            })}
          >
            <LinearGradient colors={item.color} style={styles.iconBox}>
              {item.icon}
            </LinearGradient>
            
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.subTitleRow}>
                <Text style={styles.subTitle}>{item.duration}</Text>
                <View style={styles.dot} />
                <Text style={[styles.subTitle, {color: '#10b981'}]}>{item.cal} Kcal</Text>
              </View>
            </View>

            <View style={styles.playBtn}>
                <ChevronRight color="#475569" size={22} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
            <Text style={styles.infoText}>Tüm programlar SashaFit profesyonelleri tarafından optimize edilmiştir.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, // SashaFit Deep Black
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50,
    paddingBottom: 20
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900', 
    letterSpacing: 2
  },
  scrollContent: { padding: 20 },
  welcomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  sectionDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1
  },
  card: { 
    backgroundColor: '#0f172a', 
    borderRadius: 28, 
    padding: 18, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  iconBox: { 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  info: { flex: 1, marginLeft: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  subTitle: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#334155', marginHorizontal: 8 },
  playBtn: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12
  },
  infoCard: {
    marginTop: 20,
    padding: 20,
    alignItems: 'center'
  },
  infoText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic'
  }
});