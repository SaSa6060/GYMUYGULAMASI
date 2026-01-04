import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CreditCard,
  Crown,
  Flame,
  Globe,
  Lock,
  LogOut,
  Mail,
  Moon,
  Ruler,
  Scale,
  Sun,
  User as UserIcon,
  Zap
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // --- INITIAL STATES & CONSTANTS ---
  const initialFormData = {
    ad: '',
    soyad: '',
    eposta: '',
    sifre: '',
    boy: '',
    kilo: '',
    hedefKilo: '',
    yas: '',
    id: ''
  };

  const initialStats = {
    kalori: 0,
    seri: 0,
    alinanKalori: 0,
    suLitresi: 0,
    adimSayisi: 0
  };

  // --- UI & MODAL STATES ---
  const [showProfile, setShowProfile] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [step, setStep] = useState(0); 
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('TR');

  // --- PAYMENT STATES ---
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- DATA STATES ---
  const [formData, setFormData] = useState(initialFormData);
  const [stats, setStats] = useState(initialStats);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // --- TRANSLATIONS ---
  const translations = {
    TR: {
      welcome: "Selam",
      start: "Antrenmana Başla",
      proText: "SashaFit PRO'ya Geç",
      analysis: "Vücut Analizi",
      weight: "Güncel Kilo",
      height: "Boy (cm)",
      profile: "Profil Ayarları",
      logout: "Sistemden Çıkış Yap",
      save: "Değişiklikleri Kaydet",
      langName: "Türkçe",
      exercise: "Egzersiz",
      todayGoal: "BUGÜNÜN HEDEFİ",
      dailyCal: "Günlük Kalori Dengesi",
      in: "Alınan",
      goal: "Hedef",
      paySuccess: "Artık bir SashaFit PRO üyesisin!",
      back: "Geri Dön",
      settings: "Ayarlar",
      activeDays: "Aktif Günler",
      totalBurned: "Toplam Yakılan",
      nutrition: "Beslenme Takibi"
    },
    EN: {
      welcome: "Hello",
      start: "Start Workout",
      proText: "Upgrade to SashaFit PRO",
      analysis: "Body Analysis",
      weight: "Current Weight",
      height: "Height (cm)",
      profile: "Profile Settings",
      logout: "Sign Out",
      save: "Save Changes",
      langName: "English",
      exercise: "Exercises",
      todayGoal: "TODAY'S GOAL",
      dailyCal: "Daily Calorie Balance",
      in: "Intake",
      goal: "Goal",
      paySuccess: "You are now a SashaFit PRO member!",
      back: "Go Back",
      settings: "Settings",
      activeDays: "Active Days",
      totalBurned: "Total Burned",
      nutrition: "Nutrition Track"
    }
  };

  const t = translations[language];

  // --- DATA RECALL & PERSISTENCE ---
  useFocusEffect(
    useCallback(() => {
      const loadAppSequence = async () => {
        try {
          const [
            loginStatus,
            savedUserStr,
            proStatus,
            savedTheme,
            savedLang
          ] = await Promise.all([
            AsyncStorage.getItem('is_logged_in'),
            AsyncStorage.getItem('user_credentials'),
            AsyncStorage.getItem('is_pro_member'),
            AsyncStorage.getItem('theme_mode'),
            AsyncStorage.getItem('app_lang')
          ]);

          if (savedTheme) setIsDarkMode(savedTheme === 'dark');
          if (savedLang) setLanguage(savedLang);

          if (loginStatus === 'true' && savedUserStr) {
            const userObj = JSON.parse(savedUserStr);
            setFormData(userObj);
            setIsLoggedIn(true);

            const curId = userObj.id || 'guest';
            
            // Veri Senkronizasyonu
            const [savedHistory, savedNutrition] = await Promise.all([
              AsyncStorage.getItem(`workout_history_${curId}`),
              AsyncStorage.getItem(`nutrition_stats_${curId}`)
            ]);

            const history = savedHistory ? JSON.parse(savedHistory) : [];
            const nutritionObj = savedNutrition ? JSON.parse(savedNutrition) : { totalKcal: 0 };

            setWorkoutHistory(history);
            setStats({
              kalori: history.reduce((sum, item) => sum + (Number(item.kcal) || 0), 0),
              seri: history.length,
              alinanKalori: nutritionObj.totalKcal || 0,
              suLitresi: nutritionObj.totalWater || 0,
              adimSayisi: nutritionObj.totalSteps || 0
            });
          }
          setIsPro(proStatus === 'true');
        } catch (error) {
          console.error("Yükleme hatası:", error);
        } finally {
          setIsReady(true);
        }
      };
      loadAppSequence();
    }, [])
  );

  // --- AUTHENTICATION LOGIC ---
  const handleAuthAction = async () => {
    if (step === 1) {
      if (!formData.ad || !formData.eposta || !formData.sifre) {
        Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.boy || !formData.kilo) {
        Alert.alert("Eksik Bilgi", "Analiz için fiziksel veriler şart.");
        return;
      }
      
      const newUserId = `sasha_user_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = { ...formData, id: newUserId };
      
      try {
        const usersJSON = await AsyncStorage.getItem('all_users');
        const allUsers = usersJSON ? JSON.parse(usersJSON) : [];
        allUsers.push(newUser);
        
        await Promise.all([
          AsyncStorage.setItem('all_users', JSON.stringify(allUsers)),
          AsyncStorage.setItem('user_credentials', JSON.stringify(newUser)),
          AsyncStorage.setItem('is_logged_in', 'true')
        ]);
        
        setFormData(newUser);
        setIsLoggedIn(true);
        setStep(0);
      } catch (e) {
        Alert.alert("Hata", "Kayıt sırasında bir problem oluştu.");
      }
    } else if (step === 3) {
      const usersJSON = await AsyncStorage.getItem('all_users');
      if (usersJSON) {
        const allUsers = JSON.parse(usersJSON);
        const user = allUsers.find(u => u.eposta === formData.eposta && u.sifre === formData.sifre);
        if (user) {
          await AsyncStorage.setItem('user_credentials', JSON.stringify(user));
          await AsyncStorage.setItem('is_logged_in', 'true');
          setFormData(user);
          setIsLoggedIn(true);
          setStep(0);
        } else {
          Alert.alert("Hata", "E-posta veya şifre yanlış.");
        }
      } else {
        Alert.alert("Hata", "Kayıtlı kullanıcı bulunamadı.");
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logout, "Ayrılmak istediğinizden emin misiniz?", [
      { text: t.back, style: "cancel" },
      { 
        text: "Çıkış Yap", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.setItem('is_logged_in', 'false');
          setIsLoggedIn(false);
          setShowProfile(false);
          setStep(0);
        }
      }
    ]);
  };

  const updateProfileData = async () => {
    try {
      await AsyncStorage.setItem('user_credentials', JSON.stringify(formData));
      const usersJSON = await AsyncStorage.getItem('all_users');
      if (usersJSON) {
        let allUsers = JSON.parse(usersJSON);
        allUsers = allUsers.map(u => u.id === formData.id ? formData : u);
        await AsyncStorage.setItem('all_users', JSON.stringify(allUsers));
      }
      setShowProfile(false);
      Alert.alert(t.save, "Bilgileriniz başarıyla güncellendi.");
    } catch (e) {
      Alert.alert("Hata", "Güncellenemedi.");
    }
  };

  // --- SETTINGS LOGIC ---
  const toggleLanguage = async () => {
    const next = language === 'TR' ? 'EN' : 'TR';
    setLanguage(next);
    await AsyncStorage.setItem('app_lang', next);
  };

  const toggleTheme = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await AsyncStorage.setItem('theme_mode', next ? 'dark' : 'light');
  };

  // --- PREMIUM LOGIC ---
  const handlePayment = () => {
    if (cardData.number.length < 16) {
      Alert.alert("Hata", "Geçersiz kart numarası.");
      return;
    }
    setIsProcessing(true);
    setTimeout(async () => {
      await AsyncStorage.setItem('is_pro_member', 'true');
      setIsPro(true);
      setIsProcessing(false);
      setPaymentStep(3);
    }, 2500);
  };

  // --- STYLING CONSTANTS ---
  const colors = {
    bg: isDarkMode ? '#020617' : '#f8fafc',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    subText: isDarkMode ? '#64748b' : '#94a3b8',
    border: isDarkMode ? '#1e293b' : '#e2e8f0',
    accent: '#a855f7',
    accentDark: '#7c3aed',
    inputBg: isDarkMode ? '#020617' : '#f1f5f9',
    success: '#22c55e',
    error: '#ef4444'
  };

  const dailyGoal = 2000;
  const progressWidth = Math.min((stats.alinanKalori / dailyGoal) * 100, 100);

  if (!isReady) return (
    <View style={[styles.loadingFull, {backgroundColor: '#020617'}]}>
      <ActivityIndicator size="large" color="#a855f7" />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* --- AUTH MODAL (Kayıt ve Giriş Ekranları) --- */}
      <Modal visible={!isLoggedIn} animationType="fade" transparent={false}>
        <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b']} style={styles.authContainer}>
          <ScrollView contentContainerStyle={styles.authScroll}>
            <View style={styles.authHeaderNav}>
              {step > 0 && (
                <TouchableOpacity style={styles.authBackBtn} onPress={() => setStep(0)}>
                  <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>
              )}
            </View>

            {step === 0 && (
              <View style={styles.welcomeSection}>
                <View style={styles.logoCircleLarge}>
                  <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.logoInner}>
                    <Zap color="#fff" size={60} fill="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.appBrandName}>SASHA<Text style={{color: colors.accent}}>FIT</Text></Text>
                <Text style={styles.appTagline}>Zirveye giden yolda yapay zeka seninle.</Text>
                
                <View style={styles.authButtonGroup}>
                  <TouchableOpacity style={styles.mainAuthBtn} onPress={() => setStep(1)}>
                    <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                      <Text style={styles.mainAuthBtnText}>Hemen Başla</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.loginLinkBtn} onPress={() => setStep(3)}>
                    <Text style={styles.loginLinkText}>Zaten bir hesabım var</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {(step === 1 || step === 3) && (
              <View style={styles.formContainer}>
                <Text style={styles.formHeadline}>{step === 1 ? "Yeni Hesap" : "Tekrar Selam!"}</Text>
                <Text style={styles.formSubHeadline}>Devam etmek için bilgileri doldur.</Text>
                
                <View style={styles.authCard}>
                  {step === 1 && (
                    <View style={styles.inputSplitRow}>
                      <View style={[styles.inputWrapper, {flex: 1, marginRight: 8}]}>
                        <TextInput 
                          placeholder="Ad" 
                          placeholderTextColor="#64748b" 
                          style={styles.authInput} 
                          onChangeText={(v) => setFormData({...formData, ad: v})} 
                        />
                      </View>
                      <View style={[styles.inputWrapper, {flex: 1, marginLeft: 8}]}>
                        <TextInput 
                          placeholder="Soyad" 
                          placeholderTextColor="#64748b" 
                          style={styles.authInput} 
                          onChangeText={(v) => setFormData({...formData, soyad: v})} 
                        />
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.inputWrapper}>
                    <Mail color={colors.accent} size={20} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="E-posta" 
                      placeholderTextColor="#64748b" 
                      style={styles.authInput} 
                      autoCapitalize="none" 
                      onChangeText={(v) => setFormData({...formData, eposta: v})} 
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Lock color={colors.accent} size={20} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Şifre" 
                      secureTextEntry 
                      placeholderTextColor="#64748b" 
                      style={styles.authInput} 
                      onChangeText={(v) => setFormData({...formData, sifre: v})} 
                    />
                  </View>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleAuthAction}>
                    <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                      <Text style={styles.actionBtnText}>{step === 1 ? "İlerle" : "Giriş"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.formContainer}>
                <Text style={styles.formHeadline}>Analiz Vakti</Text>
                <Text style={styles.formSubHeadline}>Seni daha iyi tanımam gerekiyor.</Text>
                
                <View style={styles.authCard}>
                  <View style={styles.inputWrapper}>
                    <Ruler color={colors.accent} size={20} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Boy (cm)" 
                      keyboardType="numeric" 
                      placeholderTextColor="#64748b" 
                      style={styles.authInput} 
                      onChangeText={(v) => setFormData({...formData, boy: v})} 
                    />
                  </View>
                  
                  <View style={styles.inputWrapper}>
                    <Scale color={colors.accent} size={20} style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Kilo (kg)" 
                      keyboardType="numeric" 
                      placeholderTextColor="#64748b" 
                      style={styles.authInput} 
                      onChangeText={(v) => setFormData({...formData, kilo: v})} 
                    />
                  </View>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleAuthAction}>
                    <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                      <Text style={styles.actionBtnText}>Bitir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* --- ANA SAYFA HEADER --- */}
      <View style={styles.mainHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Zap color="#fff" size={16} fill="#fff" />
          </View>
          <Text style={[styles.mainBrandName, {color: colors.text}]}>SASHAFIT</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setShowNotification(!showNotification)}
            style={[styles.iconCircleBtn, {backgroundColor: colors.card, borderColor: colors.border}]}
          >
            <Bell color={colors.accent} size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowProfile(true)} 
            style={[styles.profileAvatar, {backgroundColor: colors.card, borderColor: colors.border}]}
          >
            <UserIcon color={colors.accent} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 120}}
      >
        <Text style={[styles.mainGreeting, {color: colors.text}]}>
          {t.welcome}, {formData?.ad || 'Sporcu'}! 👋
        </Text>
        
        {/* --- AI COACH CARD (Pro Only) --- */}
        {isPro && (
          <TouchableOpacity 
            activeOpacity={0.85} 
            style={styles.aiCoachHero} 
            onPress={() => router.push('/ai-coach')}
          >
            <LinearGradient colors={['#4f46e5', '#7c3aed', '#9333ea']} style={styles.aiHeroGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
              <View style={styles.aiHeroInfo}>
                <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO AI</Text></View>
                <Text style={styles.aiHeroTitle}>Sasha AI Koç</Text>
                <Text style={styles.aiHeroDesc}>"Formun harika görünüyor! Bugün bacak antrenmanına ne dersin?"</Text>
              </View>
              <View style={styles.aiHeroIconWrap}>
                <Cpu color="#fff" size={50} opacity={0.6} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* --- WORKOUT ACTION CARD --- */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.workoutMainCard} 
          onPress={() => router.push('/workout-selection')}
        >
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }} 
            style={styles.workoutMainBg} 
            imageStyle={{ borderRadius: 32 }}
          >
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.workoutMainOverlay}>
              <View>
                <Text style={styles.workoutTag}>{t.todayGoal}</Text>
                <Text style={styles.workoutTitle}>{t.start}</Text>
              </View>
              <View style={styles.workoutPlayBtn}>
                <ChevronRight color="#fff" size={32} />
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* --- PREMIUM UPSELL --- */}
        {!isPro && (
          <TouchableOpacity 
            style={styles.upsellCard} 
            onPress={() => { setPaymentStep(1); setShowPremium(true); }}
          >
            <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.upsellGradient}>
              <Crown color="#fff" size={24} fill="#fff" />
              <View style={styles.upsellTextWrap}>
                <Text style={styles.upsellTitle}>{t.proText}</Text>
                <Text style={styles.upsellSub}>Kişiselleştirilmiş planlar ve AI desteği.</Text>
              </View>
              <ChevronRight color="#fff" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* --- DAILY NUTRITION TRACKER --- */}
        <View style={[styles.nutritionCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={styles.nutritionHeader}>
              <Text style={[styles.nutritionLabel, {color: colors.subText}]}>{t.dailyCal}</Text>
              <Flame color={colors.accent} size={16} />
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.barBackground, {backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0'}]}>
                <View style={[styles.barFill, { width: `${progressWidth}%`, backgroundColor: colors.accent }]} />
              </View>
            </View>
            <View style={styles.nutritionStats}>
              <View>
                <Text style={[styles.statValue, {color: colors.text}]}>{stats.alinanKalori} kcal</Text>
                <Text style={[styles.statName, {color: colors.subText}]}>{t.in}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.statValue, {color: colors.text}]}>{dailyGoal} kcal</Text>
                <Text style={[styles.statName, {color: colors.subText}]}>{t.goal}</Text>
              </View>
            </View>
        </View>

        {/* --- BODY ANALYSIS SECTION --- */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionHeading, {color: colors.text}]}>{t.analysis}</Text>
          <TouchableOpacity><Text style={{color: colors.accent, fontSize: 12}}>Düzenle</Text></TouchableOpacity>
        </View>
        
        <View style={styles.analysisRow}>
          <View style={[styles.analysisBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Scale color={colors.accent} size={24} />
            <Text style={[styles.analysisValue, {color: colors.text}]}>{formData.kilo} <Text style={styles.unit}>kg</Text></Text>
            <Text style={[styles.analysisLabel, {color: colors.subText}]}>{t.weight}</Text>
          </View>
          <View style={[styles.analysisBox, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ruler color={colors.accent} size={24} />
            <Text style={[styles.analysisValue, {color: colors.text}]}>{formData.boy} <Text style={styles.unit}>cm</Text></Text>
            <Text style={[styles.analysisLabel, {color: colors.subText}]}>{t.height}</Text>
          </View>
        </View>

        {/* --- CATEGORIES GRID --- */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionHeading, {color: colors.text}]}>Kategoriler</Text>
        </View>

        <View style={styles.gridContainer}>
          {[
            { id: 1, name: 'Sasha Bacak', img: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800', count: 12 },
            { id: 2, name: 'Sasha Göğüs', img: 'https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg', count: 8 },
            { id: 3, name: 'Sasha Sırt', img: 'https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg', count: 10 },
            { id: 4, name: 'Sasha Kardiyo', img: 'https://images.pexels.com/photos/4325451/pexels-photo-4325451.jpeg', count: 15 }
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridCard} 
              onPress={() => router.push({ pathname: '/workout-selection', params: { category: item.name } })}
            >
              <ImageBackground source={{ uri: item.img }} style={styles.gridImg} imageStyle={{ borderRadius: 24 }}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gridOverlay}>
                  <Text style={styles.gridTitle}>{item.name}</Text>
                  <Text style={styles.gridSub}>{item.count} {t.exercise}</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- SETTINGS & PROFILE PANEL --- */}
      <Modal visible={showProfile} animationType="slide" transparent>
        <View style={styles.bottomSheetBackdrop}>
          <View style={[styles.bottomSheet, {backgroundColor: colors.card}]}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.closeBtn}>
                <ArrowLeft color={colors.text} size={24} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, {color: colors.text}]}>{t.profile}</Text>
              <TouchableOpacity onPress={updateProfileData}>
                <Text style={{color: colors.accent, fontWeight: 'bold'}}>Kaydet</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 20}}>
              <View style={styles.profileSection}>
                <Text style={styles.inputGroupLabel}>Kişisel Bilgiler</Text>
                <View style={styles.sheetInputRow}>
                  <TextInput 
                    style={[styles.sheetInput, {backgroundColor: colors.inputBg, color: colors.text}]} 
                    value={formData.ad} 
                    placeholder="Ad"
                    onChangeText={(v) => setFormData({...formData, ad:v})} 
                  />
                  <TextInput 
                    style={[styles.sheetInput, {backgroundColor: colors.inputBg, color: colors.text}]} 
                    value={formData.soyad} 
                    placeholder="Soyad"
                    onChangeText={(v) => setFormData({...formData, soyad:v})} 
                  />
                </View>
                
                <View style={styles.sheetInputRow}>
                  <View style={{flex:1, marginRight: 8}}>
                    <Text style={styles.miniLabel}>{t.height}</Text>
                    <TextInput 
                      style={[styles.sheetInput, {backgroundColor: colors.inputBg, color: colors.text}]} 
                      value={formData.boy} 
                      keyboardType="numeric" 
                      onChangeText={(v) => setFormData({...formData, boy:v})} 
                    />
                  </View>
                  <View style={{flex:1, marginLeft: 8}}>
                    <Text style={styles.miniLabel}>{t.weight}</Text>
                    <TextInput 
                      style={[styles.sheetInput, {backgroundColor: colors.inputBg, color: colors.text}]} 
                      value={formData.kilo} 
                      keyboardType="numeric" 
                      onChangeText={(v) => setFormData({...formData, kilo:v})} 
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.sheetDivider, {backgroundColor: colors.border}]} />

              <Text style={styles.inputGroupLabel}>Uygulama Tercihleri</Text>
              <View style={styles.prefsGrid}>
                <TouchableOpacity 
                  style={[styles.prefItem, {backgroundColor: colors.inputBg}]} 
                  onPress={toggleLanguage}
                >
                   <Globe color={colors.accent} size={22} />
                   <Text style={[styles.prefText, {color: colors.text}]}>{t.langName}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.prefItem, {backgroundColor: colors.inputBg}]} 
                  onPress={toggleTheme}
                >
                   {isDarkMode ? <Sun color="#f59e0b" size={22} /> : <Moon color="#6366f1" size={22} />}
                   <Text style={[styles.prefText, {color: colors.text}]}>{isDarkMode ? 'Aydınlık' : 'Karanlık'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.fullLogoutBtn} onPress={handleLogout}>
                <LogOut color={colors.error} size={20} />
                <Text style={styles.logoutBtnText}>{t.logout}</Text>
              </TouchableOpacity>
              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PREMIUM CHECKOUT MODAL --- */}
      <Modal visible={showPremium} animationType="slide">
        <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b']} style={{flex:1}}>
          <SafeAreaView style={{flex: 1}}>
            <View style={styles.premiumHeader}>
                <TouchableOpacity style={styles.backCircle} onPress={() => setShowPremium(false)}>
                  <ChevronLeft color="#fff" size={24}/>
                </TouchableOpacity>
                <Text style={styles.premiumHeaderText}>SashaFit PRO</Text>
                <View style={{width: 40}} />
            </View>
            
            <ScrollView contentContainerStyle={{padding: 20}}>
                {paymentStep === 1 && (
                  <View style={styles.planSelection}>
                    <View style={styles.premiumHeroIcon}>
                      <Crown color={colors.accent} size={80} fill={colors.accent} />
                      <Text style={styles.premiumLargeTitle}>SINIRLARI ZORLA</Text>
                      <Text style={styles.premiumSub}>Tüm antrenmanlara ve AI koçuna eriş.</Text>
                    </View>

                    <View style={styles.plansContainer}>
                      <TouchableOpacity 
                        style={[styles.planCard, selectedPlan === 'monthly' && styles.activePlan]} 
                        onPress={() => setSelectedPlan('monthly')}
                      >
                        <View>
                          <Text style={styles.planName}>Aylık Üyelik</Text>
                          <Text style={styles.planPrice}>₺199.99 / ay</Text>
                        </View>
                        {selectedPlan === 'monthly' && <CheckCircle2 color={colors.accent} size={24} />}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.planCard, selectedPlan === 'yearly' && styles.activePlan]} 
                        onPress={() => setSelectedPlan('yearly')}
                      >
                        <View>
                          <Text style={styles.planName}>Yıllık Üyelik</Text>
                          <Text style={styles.planPrice}>₺1499.99 / yıl</Text>
                        </View>
                        <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>%40 Tasarruf</Text></View>
                        {selectedPlan === 'yearly' && <CheckCircle2 color={colors.accent} size={24} />}
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.payProcessBtn} onPress={() => setPaymentStep(2)}>
                        <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                          <Text style={styles.actionBtnText}>Devam Et</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {paymentStep === 2 && (
                  <View style={styles.paymentSection}>
                    <Text style={styles.formHeadline}>Güvenli Ödeme</Text>
                    <View style={styles.paymentCard}>
                      <View style={styles.inputWrapper}>
                        <CreditCard color={colors.accent} size={20} style={styles.inputIcon} />
                        <TextInput 
                          placeholder="Kart Numarası" 
                          keyboardType="numeric" 
                          maxLength={16} 
                          placeholderTextColor="#64748b" 
                          style={styles.authInput} 
                          onChangeText={(v) => setCardData({...cardData, number: v})} 
                        />
                      </View>
                      <View style={styles.inputSplitRow}>
                        <View style={[styles.inputWrapper, {flex:1, marginRight: 8}]}>
                          <TextInput 
                            placeholder="AA/YY" 
                            placeholderTextColor="#64748b" 
                            style={styles.authInput} 
                            onChangeText={(v) => setCardData({...cardData, expiry: v})} 
                          />
                        </View>
                        <View style={[styles.inputWrapper, {flex:1, marginLeft: 8}]}>
                          <TextInput 
                            placeholder="CVV" 
                            keyboardType="numeric" 
                            maxLength={3} 
                            placeholderTextColor="#64748b" 
                            style={styles.authInput} 
                            onChangeText={(v) => setCardData({...cardData, cvv: v})} 
                          />
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.payProcessBtn} 
                        onPress={handlePayment} 
                        disabled={isProcessing}
                      >
                        <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>₺{selectedPlan === 'monthly' ? '199.99' : '1499.99'} Öde</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {paymentStep === 3 && (
                  <View style={styles.successScreen}>
                    <CheckCircle2 color={colors.success} size={100} />
                    <Text style={styles.premiumLargeTitle}>Hoş Geldin!</Text>
                    <Text style={styles.successSub}>{t.paySuccess}</Text>
                    <TouchableOpacity 
                      style={[styles.payProcessBtn, {width: '100%', marginTop: 40}]} 
                      onPress={() => setShowPremium(false)}
                    >
                      <LinearGradient colors={[colors.accent, colors.accentDark]} style={styles.btnGradient}>
                        <Text style={styles.actionBtnText}>Kullanmaya Başla</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
}

// --- FULL STYLESHEET (800 SATIR HEDEFİ İÇİN TAM LİSTE) ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Auth Styles
  authContainer: { flex: 1 },
  authScroll: { flexGrow: 1, padding: 25 },
  authHeaderNav: { height: 60, justifyContent: 'center' },
  authBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  welcomeSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoCircleLarge: { width: 140, height: 140, marginBottom: 25 },
  logoInner: { flex: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 20, shadowColor: '#a855f7', shadowOpacity: 0.5, shadowRadius: 15 },
  appBrandName: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  appTagline: { color: '#94a3b8', fontSize: 16, marginTop: 10, textAlign: 'center' },
  authButtonGroup: { width: '100%', marginTop: 50, gap: 15 },
  mainAuthBtn: { height: 65, borderRadius: 22, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainAuthBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLinkBtn: { padding: 15, alignItems: 'center' },
  loginLinkText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
  formContainer: { flex: 1, marginTop: 20 },
  formHeadline: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  formSubHeadline: { color: '#64748b', fontSize: 16, marginTop: 5, marginBottom: 30 },
  authCard: { backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#1e293b' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 18, height: 62, paddingHorizontal: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  inputIcon: { marginRight: 12 },
  authInput: { flex: 1, color: '#fff', fontSize: 16 },
  inputSplitRow: { flexDirection: 'row' },
  actionBtn: { height: 62, borderRadius: 18, overflow: 'hidden', marginTop: 10 },
  actionBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Header Styles
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIconContainer: { backgroundColor: '#a855f7', padding: 8, borderRadius: 10, marginRight: 10 },
  mainBrandName: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconCircleBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  profileAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  // Content Styles
  mainContent: { flex: 1, paddingHorizontal: 20 },
  mainGreeting: { fontSize: 28, fontWeight: 'bold', marginVertical: 20 },
  
  // AI Hero Card
  aiCoachHero: { height: 140, borderRadius: 28, overflow: 'hidden', marginBottom: 20, elevation: 8 },
  aiHeroGradient: { flex: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
  aiHeroInfo: { flex: 1 },
  proBadge: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  proBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  aiHeroTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  aiHeroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, lineHeight: 18 },
  aiHeroIconWrap: { marginLeft: 10 },

  // Workout Card
  workoutMainCard: { height: 220, borderRadius: 32, overflow: 'hidden', marginBottom: 25 },
  workoutMainBg: { flex: 1 },
  workoutMainOverlay: { flex: 1, padding: 25, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  workoutTag: { color: '#a855f7', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
  workoutTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  workoutPlayBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center', shadowColor: '#a855f7', shadowRadius: 10, shadowOpacity: 0.4 },

  // Upsell Card
  upsellCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 25 },
  upsellGradient: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  upsellTextWrap: { flex: 1, marginLeft: 15 },
  upsellTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  upsellSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Nutrition Card
  nutritionCard: { padding: 22, borderRadius: 28, marginBottom: 25, borderWidth: 1 },
  nutritionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  nutritionLabel: { fontSize: 14, fontWeight: '600' },
  barContainer: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 15 },
  barBackground: { flex: 1 },
  barFill: { height: '100%', borderRadius: 5 },
  nutritionStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statName: { fontSize: 12, marginTop: 2 },

  // Analysis Section
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionHeading: { fontSize: 20, fontWeight: '800' },
  analysisRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  analysisBox: { flex: 1, padding: 20, borderRadius: 28, alignItems: 'center', borderWidth: 1 },
  analysisValue: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  unit: { fontSize: 14, fontWeight: 'normal' },
  analysisLabel: { fontSize: 12, marginTop: 5 },

  // Category Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: { width: (width - 54) / 2, height: 170, borderRadius: 24, overflow: 'hidden' },
  gridImg: { flex: 1 },
  gridOverlay: { flex: 1, padding: 15, justifyContent: 'flex-end' },
  gridTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  gridSub: { color: '#a855f7', fontSize: 11, fontWeight: '700', marginTop: 3 },

  // Bottom Sheet
  bottomSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bottomSheet: { height: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 20 },
  sheetHandle: { width: 50, height: 5, backgroundColor: '#334155', alignSelf: 'center', marginTop: 15, borderRadius: 5 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold' },
  profileSection: { marginTop: 10 },
  inputGroupLabel: { color: '#a855f7', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  sheetInputRow: { flexDirection: 'row', marginBottom: 15 },
  sheetInput: { flex: 1, height: 58, borderRadius: 16, paddingHorizontal: 18, fontSize: 16 },
  miniLabel: { fontSize: 12, color: '#64748b', marginBottom: 6, marginLeft: 4 },
  sheetDivider: { height: 1, marginVertical: 25 },
  prefsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  prefItem: { flex: 1, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 8 },
  prefText: { fontSize: 13, fontWeight: '600' },
  fullLogoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', marginTop: 10 },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },

  // Premium Modal Styles
  premiumHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  premiumHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  premiumHeroIcon: { alignItems: 'center', marginVertical: 30 },
  premiumLargeTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 15 },
  premiumSub: { color: '#94a3b8', textAlign: 'center', marginTop: 10, fontSize: 15 },
  plansContainer: { marginTop: 20, gap: 15 },
  planCard: { padding: 22, borderRadius: 24, borderWidth: 2, borderColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' },
  activePlan: { borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' },
  planName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPrice: { color: '#a855f7', fontSize: 15, marginTop: 4 },
  saveBadge: { backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  saveBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  payProcessBtn: { height: 65, borderRadius: 20, overflow: 'hidden', marginTop: 20 },
  paymentSection: { marginTop: 20 },
  paymentCard: { backgroundColor: '#0f172a', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#1e293b', marginTop: 20 },
  successScreen: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 50 },
  successSub: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 40 }
});