import { useRouter } from 'expo-router';
import { Check, X, Zap } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PremiumScreen() {
  const router = useRouter();

  const features = [
    "Yapay Zeka Destekli Antrenman Planı", "Kişiye Özel Diyet Programları",
    "Video ve Animasyonlu Egzersiz Anlatımları", "Detaylı İlerleme Raporları",
    "AI Coach - 7/24 Destek", "Sınırsız Antrenman Programı",
    "Gelişmiş Beslenme Takibi", "Öncelikli Müşteri Desteği"
  ];

  // Güvenli kapatma fonksiyonu
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* BURASI GÜNCELLENDİ: Hata vermeden kapatır */}
        <TouchableOpacity onPress={handleClose} style={{ padding: 10 }}>
          <X color="#94a3b8" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium'a Geç</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.promoBanner}>
          <Zap color="#3b82f6" size={20} fill="#3b82f6" />
          <Text style={styles.promoText}>
            <Text style={{ fontWeight: 'bold' }}>7 gün ücretsiz deneme!</Text> İstediğiniz zaman iptal edebilirsiniz.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <TouchableOpacity style={styles.planCard}>
            <Text style={styles.planTitle}>Aylık</Text>
            <Text style={styles.planSubTitle}>Esnek plan</Text>
            <Text style={styles.planPrice}>49.99 <Text style={styles.currency}>₺/ay</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, styles.activePlan]}>
            <View style={styles.checkBadge}><Check color="#fff" size={14} /></View>
            <Text style={[styles.planTitle, { color: '#10b981' }]}>Yıllık</Text>
            <Text style={styles.popularText}>En popüler</Text>
            <Text style={styles.planPrice}>33.33 <Text style={styles.currency}>₺/ay</Text></Text>
            <Text style={styles.annualTotal}>399.99₺ yıllık olarak faturalandırılır</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Özellikleri</Text>
          <View style={styles.featuresGrid}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <Check color="#10b981" size={18} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.subscribeButton} 
          onPress={() => alert("Ödeme sistemi yakında eklenecek!")}
        >
          <Text style={styles.subscribeButtonText}>Ücretsiz Denemeyi Başlat</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { paddingHorizontal: 20 },
  promoBanner: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  promoText: { color: '#3b82f6', fontSize: 13 },
  plansContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  planCard: { flex: 1, backgroundColor: '#1e293b', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  activePlan: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  checkBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#10b981', borderRadius: 10, padding: 2 },
  planTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  planSubTitle: { color: '#94a3b8', fontSize: 12, marginBottom: 15 },
  popularText: { color: '#10b981', fontSize: 12, marginBottom: 15, fontWeight: '500' },
  planPrice: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  currency: { fontSize: 14, color: '#94a3b8' },
  annualTotal: { color: '#64748b', fontSize: 10, marginTop: 10 },
  featuresSection: { backgroundColor: '#1e293b', padding: 20, borderRadius: 24, marginBottom: 25 },
  featuresTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  featureText: { color: '#cbd5e1', fontSize: 13 },
  subscribeButton: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 40 },
  subscribeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});