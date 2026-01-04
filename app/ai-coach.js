import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    Calendar,
    ChevronLeft, Cpu, CreditCard,
    KeyRound,
    Lock,
    Plus,
    Send
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Dimensions, FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform, SafeAreaView,
    ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// --- GROQ API AYARI ---
const GROQ_API_KEY = "YOUR_API_KEY";

export default function AICoachScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userData, setUserData] = useState({ info: { id: 'guest', ad: 'Sporcu' }, isPro: false, workout: { kcal: 0, streak: 0 }, nutrition: { totalKcal: 0 } });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });

    const flatListRef = useRef();

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        return () => showSubscription.remove();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const refreshStatus = async () => {
                const user = await loadUserData();
                if (user && user.info?.id) {
                    await loadChatHistory(user.info.id);
                }
            };
            refreshStatus();
        }, [])
    );

    const loadUserData = async () => {
        try {
            const credentials = await AsyncStorage.getItem('user_credentials');
            const parsedCreds = credentials ? JSON.parse(credentials) : null;
            const proStatus = await AsyncStorage.getItem('is_pro_member');
            const isProNow = proStatus === 'true' || (parsedCreds && parsedCreds.isPro);

            const userId = parsedCreds?.id || 'guest';
            const stats = await AsyncStorage.getItem('user_stats'); // Ortak anahtar kullanımı
            
            const data = {
                info: parsedCreds || { ad: 'Sporcu', id: 'guest' },
                isPro: isProNow,
                workout: stats ? JSON.parse(stats) : { kcal: 0, count: 0 },
                nutrition: { totalKcal: 0 }
            };
            setUserData(data);
            return data;
        } catch (e) { return null; }
    };

    const loadChatHistory = async (userId) => {
        try {
            const savedHistory = await AsyncStorage.getItem(`sasha_chat_history_${userId}`);
            if (savedHistory) {
                setMessages(JSON.parse(savedHistory));
            } else {
                const welcomeMsg = {
                    id: '1',
                    text: `Selam ${userData?.info?.ad || 'şampiyon'}! Ben Sasha. Bugün seninle hedeflerine özel bir plan yapalım mı?`,
                    sender: 'ai',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages([welcomeMsg]);
            }
        } catch (e) { console.log("Hafıza yükleme hatası:", e); }
    };

    const saveChatHistory = async (newMessages) => {
        try {
            const userId = userData.info?.id || 'guest';
            await AsyncStorage.setItem(`sasha_chat_history_${userId}`, JSON.stringify(newMessages));
        } catch (e) { console.log("Hafıza kaydetme hatası:", e); }
    };

    const handlePayment = async () => {
        if (cardData.number.length < 16) return Alert.alert("Hata", "Geçerli bir kart numarası girin.");
        setIsProcessing(true);
        setTimeout(async () => {
            try {
                await AsyncStorage.setItem('is_pro_member', 'true');
                setUserData(prev => ({ ...prev, isPro: true }));
                setIsProcessing(false);
                setShowPaymentForm(false);
                Alert.alert("Tebrikler!", "Artık PRO üyesisin.");
            } catch (e) { setIsProcessing(false); }
        }, 2000);
    };

    // --- GROQ API BAĞLANTISI ---
    const handleSend = async () => {
        if (inputText.trim() === '' || !userData.isPro || isTyping) return;

        const userText = inputText.trim();
        const userMsg = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `Sen SashaFit uygulamasının koçu Sasha'sın. Kullanıcı adı: ${userData.info.ad}. 
                            Kullanıcının bugüne kadar yaktığı toplam kalori: ${userData.workout.kcal}. 
                            Profesyonel, motive edici ve kısa cevaplar ver. Spor ve beslenme dışına çıkma.`
                        },
                        ...updatedMessages.map(m => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.text
                        }))
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const aiText = data.choices[0].message.content;

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const finalMessages = [...updatedMessages, aiMsg];
            setMessages(finalMessages);
            saveChatHistory(finalMessages);
        } catch (error) {
            console.error("Groq Hatası:", error);
            Alert.alert("Hata", "Sasha şu an meşgul, lütfen tekrar dene.");
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft color="#fff" size={28} /></TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Sasha AI Koç</Text>
                    <View style={styles.onlineStatus}>
                        <View style={[styles.onlineDot, { backgroundColor: userData.isPro ? '#22C55E' : '#64748B' }]} />
                        <Text style={styles.onlineText}>{userData.isPro ? 'PRO Aktif' : 'Sınırlı Mod'}</Text>
                    </View>
                </View>
                <View style={styles.cpuIcon}><Cpu color="#8B5CF6" size={26} /></View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => (
                        <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                            <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                                <Text style={styles.messageText}>{item.text}</Text>
                                <Text style={styles.messageTime}>{item.time}</Text>
                            </View>
                        </View>
                    )}
                />

                {isTyping && <View style={styles.typingContainer}><Text style={styles.typingText}>Sasha yazıyor...</Text></View>}

                <View style={[styles.inputContainer, !userData.isPro && { opacity: 0.1 }]}>
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.attachBtn}><Plus color="#94A3B8" size={22} /></TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Sasha'ya bir şey yaz..."
                            placeholderTextColor="#64748B"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                            editable={userData.isPro}
                        />
                        <TouchableOpacity
                            style={[styles.newSendBtn, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || !userData.isPro || isTyping}
                        >
                            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.newSendGradient}>
                                <Send color="#fff" size={18} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {!userData.isPro && (
                <View style={styles.lockOverlay}>
                    <LinearGradient colors={['transparent', 'rgba(2, 6, 23, 1)', '#020617']} style={styles.lockGradient}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                            {!showPaymentForm ? (
                                <View style={styles.lockContent}>
                                    <Lock color="#8B5CF6" size={40} style={{ marginBottom: 10 }} />
                                    <Text style={styles.lockTitle}>Sasha PRO</Text>
                                    <Text style={styles.lockDesc}>Kişisel AI koçunla sınırsız sohbet için yükselt.</Text>
                                    <TouchableOpacity style={styles.proBtn} onPress={() => setShowPaymentForm(true)}>
                                        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.proBtnGradient}>
                                            <Text style={styles.proBtnText}>Hemen Yükselt - ₺149.99</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.paymentContainer}>
                                    <Text style={styles.paymentTitle}>Kart Bilgileri</Text>
                                    <View style={styles.inputGroup}>
                                        <View style={styles.fancyInput}>
                                            <CreditCard color="#8B5CF6" size={20} /><TextInput placeholder="Kart Numarası" placeholderTextColor="#475569" style={styles.cardInput} keyboardType="numeric" maxLength={16} onChangeText={(v) => setCardData({ ...cardData, number: v })} />
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                        <View style={[styles.fancyInput, { flex: 1 }]}><Calendar color="#8B5CF6" size={20} /><TextInput placeholder="AA/YY" placeholderTextColor="#475569" style={styles.cardInput} keyboardType="numeric" onChangeText={(v) => setCardData({ ...cardData, expiry: v })} /></View>
                                        <View style={[styles.fancyInput, { flex: 1 }]}><KeyRound color="#8B5CF6" size={20} /><TextInput placeholder="CVV" placeholderTextColor="#475569" style={styles.cardInput} keyboardType="numeric" secureTextEntry onChangeText={(v) => setCardData({ ...cardData, cvv: v })} /></View>
                                    </View>
                                    <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
                                        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.proBtnGradient}>{isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.proBtnText}>Öde ve Başla</Text>}</LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setShowPaymentForm(false)}><Text style={{ color: '#64748B', textAlign: 'center' }}>Vazgeç</Text></TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </LinearGradient>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, paddingTop: Platform.OS === 'ios' ? 10 : 45, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
    backBtn: { backgroundColor: '#1E293B', padding: 8, borderRadius: 12 },
    headerInfo: { flex: 1, marginLeft: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
    onlineText: { color: '#64748B', fontSize: 11 },
    cpuIcon: { backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: 10, borderRadius: 15 },
    chatList: { padding: 20, paddingBottom: 20 },
    messageWrapper: { marginBottom: 15, maxWidth: '82%' },
    userWrapper: { alignSelf: 'flex-end' },
    aiWrapper: { alignSelf: 'flex-start' },
    messageBubble: { padding: 14, borderRadius: 20, backgroundColor: '#1E293B' },
    userBubble: { backgroundColor: '#8B5CF6', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: '#1E293B', borderBottomLeftRadius: 4 },
    messageText: { color: '#fff', fontSize: 15, lineHeight: 22 },
    messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: '#1E293B', paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#0F172A', borderRadius: 25, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#1E293B' },
    attachBtn: { padding: 8 },
    textInput: { flex: 1, color: '#fff', fontSize: 15, paddingHorizontal: 8, paddingVertical: 8, maxHeight: 120 },
    newSendBtn: { marginBottom: 2, marginLeft: 4 },
    newSendGradient: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    typingContainer: { paddingHorizontal: 25, paddingVertical: 5 },
    typingText: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
    lockOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
    lockGradient: { flex: 1, paddingHorizontal: 25 },
    lockContent: { alignItems: 'center' },
    lockTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    lockDesc: { color: '#94A3B8', textAlign: 'center', marginVertical: 15 },
    proBtn: { width: '100%' },
    proBtnGradient: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    proBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    paymentContainer: { backgroundColor: '#1E293B', padding: 25, borderRadius: 25, width: '100%', borderWidth: 1, borderColor: '#334155' },
    paymentTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    inputGroup: { marginBottom: 15 },
    fancyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 12, paddingHorizontal: 15, height: 55 },
    cardInput: { flex: 1, color: '#fff', marginLeft: 10 }
});