import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Smile, Utensils, Moon, ClipboardList, Star, Heart, Coffee } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ParentActivityFlowScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dailyLog, setDailyLog] = useState<any>(null);
    const [myChild, setMyChild] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Child Info
            let studentQuery = supabase.from('students').select('*, classes(name)');
            studentQuery = user.targetId ? studentQuery.eq('id', user.targetId) : studentQuery.eq('parent_id', user.id).or(`parent_name.eq.${user.name}`);
            const { data: student } = await studentQuery.maybeSingle();

            if (student) {
                setMyChild(student);

                // 2. Fetch Today's Daily Log
                const today = new Date().toISOString().split('T')[0];
                const { data: log } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('student_id', student.id)
                    .eq('date', today)
                    .maybeSingle();

                setDailyLog(log);
            }
        } catch (error) {
            console.error("fetchData Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodColor = (mood: string) => {
        switch (mood) {
            case 'Mutlu': return '#10b981';
            case 'Normal': return '#3b82f6';
            case 'Üzgün': return '#f43f5e';
            case 'Huzursuz': return '#f59e0b';
            case 'Heyecanlı': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fcfcfd', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 12, color: '#94a3b8', fontSize: 13, fontWeight: '500' }}>Günlük karne hazırlanıyor...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fcfcfd' }}>
            {/* HEADER */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: 'white' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <ChevronLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <View style={{ marginLeft: 16 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#1e293b' }}>Günlük Karne</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

                {/* COMPACT STUDENT INFO */}
                <View style={{ marginBottom: 20, padding: 12, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                        {myChild?.image_url || myChild?.photo_url ? (
                            <Image source={{ uri: myChild.image_url || myChild.photo_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>{myChild?.initials || '??'}</Text>
                            </View>
                        )}
                    </View>
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b' }}>{myChild?.name}</Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>{myChild?.classes?.name || 'Sınıf Bilgisi'}</Text>
                    </View>
                </View>

                {!dailyLog ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <ClipboardList size={40} color="#e2e8f0" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#94a3b8', textAlign: 'center' }}>Henüz Günlük Kayıt Girilmemiş</Text>
                        <Text style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', marginTop: 4 }}>Öğretmeniniz gün sonuna kadar bilgileri tamamlayacaktır.</Text>
                    </View>
                ) : (
                    <View style={{ gap: 16 }}>

                        {/* MOOD CARD */}
                        <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                                        <Smile size={18} color="#22c55e" />
                                    </View>
                                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>GÜNÜN MODU</Text>
                                </View>
                                <View style={{ backgroundColor: getMoodColor(dailyLog.mood) + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                    <Text style={{ color: getMoodColor(dailyLog.mood), fontSize: 11, fontWeight: '900' }}>{dailyLog.mood?.toUpperCase()}</Text>
                                </View>
                            </View>
                            <View style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                                <View style={{ width: '100%', height: '100%', backgroundColor: getMoodColor(dailyLog.mood) }} />
                            </View>
                        </View>

                        {/* FOOD JSON CARD */}
                        <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#fefce8', alignItems: 'center', justifyContent: 'center' }}>
                                    <Utensils size={18} color="#eab308" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>BESLENME DURUMU</Text>
                            </View>

                            <View style={{ gap: 10 }}>
                                {dailyLog.food_json && Object.entries(dailyLog.food_json).map(([meal, status]: any) => (
                                    <View key={meal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status === 'Hepsini Bitirdi' ? '#22c55e' : status === 'Az Yedi' ? '#f59e0b' : '#f43f5e' }} />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>{meal}</Text>
                                        </View>
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: status === 'Hepsini Bitirdi' ? '#16a34a' : '#64748b' }}>{status}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* SLEEP CARD */}
                        <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }}>
                                    <Moon size={18} color="#8b5cf6" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>UYKU DÜZENİ</Text>
                            </View>
                            <View style={{ padding: 12, backgroundColor: '#fcfcfd', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>
                                    {dailyLog.sleep_duration ? `${dailyLog.sleep_duration} dakika dinlendi.` : 'Bugün uyumadı.'}
                                </Text>
                            </View>
                        </View>

                        {/* NOTES / ACTIVITY CARD */}
                        <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                                    <Heart size={18} color="#3b82f6" />
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>ÖĞRETMEN NOTU</Text>
                            </View>
                            <View style={{ padding: 12, backgroundColor: '#fcfcfd', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
                                <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18, fontWeight: '500' }}>
                                    {dailyLog.notes || 'Bugün için bir not eklenmemiş.'}
                                </Text>
                            </View>
                        </View>

                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ParentActivityFlowScreen;
