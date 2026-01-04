import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  Apple,
  Check,
  Coffee,
  Droplets,
  Moon,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  Utensils,
  X
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function NutritionScreen() {
  const [loading, setLoading] = useState(true);
  const [waterCount, setWaterCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodCal, setFoodCal] = useState('');
  const [userId, setUserId] = useState(null);
  
  const goalCalories = 2500;
  
  const initialMeals = {
    'Kahvaltı': { cal: 0, items: 'Henüz bir şey eklenmedi' },
    'Öğle Yemeği': { cal: 0, items: 'Henüz bir şey eklenmedi' },
    'Akşam Yemeği': { cal: 0, items: 'Henüz bir şey eklenmedi' },
    'Atıştırmalık': { cal: 0, items: 'Henüz bir şey eklenmedi' },
  };

  const [meals, setMeals] = useState(initialMeals);

  // KULLANICI DEĞİŞİKLİĞİNİ KESİN OLARAK DENETLEYEN YÜKLEME FONKSİYONU
  useFocusEffect(
    useCallback(() => {
      const loadNutritionData = async () => {
        try {
          setLoading(true);
          
          // 1. Güncel kullanıcıyı al
          const credentials = await AsyncStorage.getItem('user_credentials');
          const user = credentials ? JSON.parse(credentials) : null;
          const curId = user?.id || 'guest';
          
          // State'e kullanıcıyı set et
          setUserId(curId);

          // 2. SADECE bu kullanıcıya ait verileri anahtar olarak kullan
          const userSpecificMealKey = `meals_data_v2_${curId}`;
          const userSpecificWaterKey = `water_data_v2_${curId}`;

          const savedMeals = await AsyncStorage.getItem(userSpecificMealKey);
          const savedWater = await AsyncStorage.getItem(userSpecificWaterKey);
          
          // 3. Eğer bu ID için veri yoksa kesinlikle sıfırla (Eski kullanıcının verisi gelmesin)
          if (savedMeals !== null) {
            setMeals(JSON.parse(savedMeals));
          } else {
            setMeals(initialMeals);
          }
          
          if (savedWater !== null) {
            setWaterCount(parseInt(savedWater));
          } else {
            setWaterCount(0);
          }

        } catch (e) {
          console.log("SashaFit Yükleme Hatası:", e);
        } finally {
          setLoading(false);
        }
      };

      loadNutritionData();
    }, [])
  );

  const saveNutritionUpdate = async (updatedMeals, currentWater = waterCount) => {
    try {
      // Kayıt anında güncel ID'yi doğrula
      const credentials = await AsyncStorage.getItem('user_credentials');
      const user = credentials ? JSON.parse(credentials) : null;
      const curId = user?.id || 'guest';

      const mealKey = `meals_data_v2_${curId}`;
      const waterKey = `water_data_v2_${curId}`;
      const statsKey = `stats_data_v2_${curId}`;

      await AsyncStorage.setItem(mealKey, JSON.stringify(updatedMeals));
      await AsyncStorage.setItem(waterKey, currentWater.toString());
      
      const totalKcal = Object.values(updatedMeals).reduce(
        (sum, meal) => sum + (Number(meal.cal) || 0), 
        0
      );
      
      const nutritionStats = {
        totalKcal: totalKcal,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(statsKey, JSON.stringify(nutritionStats));
    } catch (error) {
      console.log("SashaFit Kayıt Hatası:", error);
    }
  };

  const handleResetDay = () => {
    Alert.alert(
      "Günü Sıfırla",
      "Tüm verilerin temizlenecek. Emin misin?",
      [
        { 
          text: "Vazgeç", 
          style: "cancel" 
        },
        { 
          text: "Evet, Sıfırla", 
          style: "destructive", 
          onPress: async () => {
            setMeals(initialMeals);
            setWaterCount(0);
            await saveNutritionUpdate(initialMeals, 0);
          } 
        }
      ]
    );
  };

  const handleAddFood = async () => {
    if (!foodName.trim() || !foodCal.trim()) {
      return Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
    }

    const calInt = parseInt(foodCal);
    if (isNaN(calInt)) {
      return Alert.alert("Hata", "Kalori sayı olmalıdır.");
    }

    const updatedMeals = {
      ...meals,
      [selectedMeal]: {
        cal: (meals[selectedMeal].cal || 0) + calInt,
        items: meals[selectedMeal].items === 'Henüz bir şey eklenmedi' 
          ? foodName 
          : meals[selectedMeal].items + ', ' + foodName
      }
    };

    setMeals(updatedMeals);
    await saveNutritionUpdate(updatedMeals);
    
    setFoodName('');
    setFoodCal('');
    setModalVisible(false);
  };

  const handleRemoveMeal = (mealName) => {
    Alert.alert(
      "Öğünü Sıfırla",
      `${mealName} içeriği temizlensin mi?`,
      [
        { 
          text: "Hayır", 
          style: "cancel" 
        },
        { 
          text: "Evet, Temizle", 
          style: "destructive", 
          onPress: async () => {
            const updatedMeals = {
              ...meals,
              [mealName]: { cal: 0, items: 'Henüz bir şey eklenmedi' }
            };
            setMeals(updatedMeals);
            await saveNutritionUpdate(updatedMeals);
          } 
        }
      ]
    );
  };

  const updateWater = async (count) => {
    setWaterCount(count);
    await saveNutritionUpdate(meals, count);
  };

  const totalConsumed = Object.values(meals).reduce(
    (sum, meal) => sum + (Number(meal.cal) || 0), 
    0
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#a855f7" style={{flex: 1}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        
        <View style={styles.header}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View>
              <Text style={styles.headerTitle}>Beslenme Takibi</Text>
              <Text style={styles.headerUser}>Kullanıcı: {userId}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleResetDay} 
              style={styles.resetBtn}
            >
              <RotateCcw color="#94a3b8" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDate}>Bugün Alınan: {totalConsumed} / {goalCalories} kcal</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.mainCalorie}>
            <Target color="#a855f7" size={24} />
            <Text style={styles.calorieValue}>
              {goalCalories - totalConsumed > 0 ? goalCalories - totalConsumed : 0}
            </Text>
            <Text style={styles.calorieLabel}>Kalan Kalori Hedefin</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min((totalConsumed / goalCalories) * 100, 100)}%` }
              ]} 
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Günün Öğünleri</Text>
        
        {Object.keys(meals).map((mealName) => (
          <MealItem 
            key={mealName}
            title={mealName} 
            cal={meals[mealName].cal} 
            items={meals[mealName].items} 
            onPress={() => {
              setSelectedMeal(mealName);
              setModalVisible(true);
            }}
            onDelete={() => handleRemoveMeal(mealName)}
            icon={
              mealName === 'Kahvaltı' ? <Coffee color="#f59e0b" size={20}/> : 
              mealName === 'Öğle Yemeği' ? <Utensils color="#10b981" size={20}/> :
              mealName === 'Akşam Yemeği' ? <Moon color="#3b82f6" size={20}/> : 
              <Apple color="#ef4444" size={20}/>
            }
          />
        ))}

        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Günlük Su Takibi</Text>
            <Text style={{color: '#0ea5e9', fontWeight: 'bold'}}>
              {waterCount * 250} ml / 2.5L
            </Text>
          </View>
          <View style={styles.waterGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => updateWater(i)} 
                style={[
                  styles.waterDrop, 
                  i <= waterCount && styles.waterDropActive
                ]}
              >
                <Droplets 
                  color={i <= waterCount ? "#fff" : "#0ea5e9"} 
                  size={18} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={modalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMeal} Kaydı</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TextInput 
              style={styles.input} 
              placeholder="Yemek Adı (Örn: Izgara Tavuk)" 
              placeholderTextColor="#64748b"
              value={foodName}
              onChangeText={setFoodName}
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Kalori Miktarı (kcal)" 
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={foodCal}
              onChangeText={setFoodCal}
            />
            
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={handleAddFood}
            >
              <Check color="#fff" size={20} />
              <Text style={styles.addBtnText}>SashaFit Listeme Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MealItem({ title, cal, items, icon, onPress, onDelete }) {
  return (
    <View style={styles.mealCard}>
      <TouchableOpacity 
        onPress={onPress} 
        style={{flexDirection: 'row', alignItems: 'center', flex: 1}}
      >
        <View style={styles.mealIcon}>{icon}</View>
        <View style={{flex: 1, marginLeft: 15}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.mealTitle}>{title}</Text>
            <Text 
              style={{
                color: cal > 0 ? '#10b981' : '#64748b', 
                fontSize: 13, 
                fontWeight: 'bold', 
                marginRight: 10
              }}
            >
              {cal} kcal
            </Text>
          </View>
          <Text style={styles.mealItems} numberOfLines={1}>{items}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
        {cal > 0 && (
          <TouchableOpacity onPress={onDelete} style={{padding: 5}}>
            <Trash2 color="#ef4444" size={18} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onPress}>
          <Plus color="#334155" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020617' 
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 50 
  },
  header: { 
    marginBottom: 20, 
    paddingTop: Platform.OS === 'android' ? 30 : 10 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: 'bold' 
  },
  headerUser: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2
  },
  headerDate: { 
    color: '#a855f7', 
    fontSize: 14, 
    fontWeight: '600', 
    marginTop: 5 
  },
  resetBtn: { 
    padding: 8, 
    backgroundColor: '#0f172a', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  summaryCard: { 
    backgroundColor: '#0f172a', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  mainCalorie: { 
    alignItems: 'center', 
    marginBottom: 15 
  },
  calorieValue: { 
    color: '#fff', 
    fontSize: 48, 
    fontWeight: 'bold' 
  },
  calorieLabel: { 
    color: '#94a3b8', 
    fontSize: 14 
  },
  progressBarBg: { 
    height: 10, 
    backgroundColor: '#020617', 
    borderRadius: 5, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#a855f7' 
  },
  sectionTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  mealCard: { 
    backgroundColor: '#0f172a', 
    borderRadius: 20, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  mealIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#020617', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mealTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  mealItems: { 
    color: '#64748b', 
    fontSize: 13 
  },
  waterCard: { 
    backgroundColor: '#0f172a', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  waterHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  waterTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  waterGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  waterDrop: { 
    width: 35, 
    height: 35, 
    borderRadius: 10, 
    backgroundColor: '#020617', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  waterDropActive: { 
    backgroundColor: '#0ea5e9' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(2,6,23,0.95)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#0f172a', 
    borderRadius: 25, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  input: { 
    backgroundColor: '#020617', 
    borderRadius: 12, 
    padding: 15, 
    color: '#fff', 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  addBtn: { 
    backgroundColor: '#a855f7', 
    borderRadius: 12, 
    padding: 15, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  addBtnText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  }
});