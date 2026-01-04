import { useRouter } from 'expo-router';
import { ChevronRight, Dumbbell, Zap } from 'lucide-react-native';
import { FlatList, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { id: '1', title: 'Göğüs & Omuz', count: '24 Egzersiz', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', slug: 'chest-shoulder' },
  { id: '2', title: 'Sırt & Kanat', count: '18 Egzersiz', image: 'https://images.unsplash.com/photo-1603287611497-da2904576326?w=800', slug: 'back' },
  { id: '3', title: 'Bacak & Kalça', count: '32 Egzersiz', image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800', slug: 'legs' },
  { id: '4', title: 'Kol (Biceps/Triceps)', count: '15 Egzersiz', image: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=800', slug: 'arms' },
  { id: '5', title: 'Karın (Abs)', count: '12 Egzersiz', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', slug: 'abs' },
];

export default function ExercisesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kütüphane</Text>
          <Text style={styles.headerSub}>Hangi bölgeyi çalıştırıyoruz?</Text>
        </View>
        <TouchableOpacity style={styles.searchIcon}>
          <Zap color="#f59e0b" size={24} fill="#f59e0b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.categoryCard} 
            activeOpacity={0.8}
            onPress={() => {
              // YÖNLENDİRME BURADA: app/exercises/[id].js'e gider
              router.push({
                pathname: "/exercises/[id]",
                params: { id: item.slug, categoryTitle: item.title }
              });
            }}
          >
            <ImageBackground 
              source={{ uri: item.image }} 
              style={styles.cardImage} 
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.countRow}>
                    <Dumbbell color="#8b5cf6" size={14} />
                    <Text style={styles.cardCount}>{item.count}</Text>
                  </View>
                </View>
                <View style={styles.arrowBox}>
                  <ChevronRight color="#fff" size={20} />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 30,
    paddingBottom: 20 
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: '#64748b', fontSize: 14, marginTop: 5 },
  searchIcon: { 
    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
    padding: 10, 
    borderRadius: 15 
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  categoryCard: { 
    height: 160, 
    marginBottom: 20, 
    borderRadius: 20,
    elevation: 5 
  },
  cardImage: { flex: 1 },
  cardOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.45)', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end' 
  },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCount: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  arrowBox: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    padding: 8, 
    borderRadius: 12 
  }
});