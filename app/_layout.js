import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export default function RootLayout() {
  const [user, setUser] = useState(null); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // --- BU KISIM ÖNEMLİ: TEST MODU ---
        // Uygulama her açıldığında (Metro Bundler tetiklendiğinde) 
        // önceki girişi temizler, böylece hep Login'den başlarsın.
        await AsyncStorage.removeItem('active_user');
        await AsyncStorage.removeItem('is_logged_in');
        
        const userData = await AsyncStorage.getItem('active_user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.log("Sistem başlatma hatası:", e);
      } finally {
        setIsReady(true);
      }
    };
    initializeApp();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('active_user', JSON.stringify(userData));
    await AsyncStorage.setItem('is_logged_in', 'true');
  };

  const logout = async () => {
    try {
      Alert.alert(
        "Çıkış Yap",
        "Tüm verilerin sıfırlanacak. Emin misin?",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Her Şeyi Sil ve Çık",
            style: "destructive",
            onPress: async () => {
              setUser(null);
              await AsyncStorage.clear(); 
              console.log("SashaFit: Veriler temizlendi.");
            }
          }
        ]
      );
    } catch (e) {
      console.log("Çıkış hatası:", e);
    }
  };

  if (!isReady) return null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn: !!user, 
      isPro: user?.isPro || false, 
      login, 
      logout 
    }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#020617' }
        }}
      >
        {/* Index dosyanın (Login/Register) ilk ekran olduğundan emin ol */}
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="exercises/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ai-coach" /> 
      </Stack>
    </AuthContext.Provider>
  );
}