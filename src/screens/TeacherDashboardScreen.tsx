import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { LogOut, Bell, ChevronRight, LayoutGrid, Pill, Palette, Utensils, Clock, Heart, Megaphone, CheckSquare, School } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TeacherDashboardScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const [arrivals, setArrivals] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [teacherClass, setTeacherClass] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTeacherData();
    }, [user]);

    const fetchTeacherData = async () => {
        try {
            setLoading(true);
            const { data: classData } = await supabase.from('classes').select('*').eq('teacher_id', user.id).maybeSingle();
            if (classData) {
                setTeacherClass(classData);
                const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classData.id).eq('status', 'Aktif').order('name');
                setStudents(studentsData || []);
                fetchArrivals();
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchArrivals = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('arrivals').select('*, students(name, initials, color)').eq('status', 'coming').gte('created_at', today);
        setArrivals(data || []);
    };

    // Sophisticated Pastel Themes for Menu (Matching Admin)
    const menuItems = [
        {
            title: 'Günlük\nGünce',
            sub: 'Yemek, Uyku',
            icon: Heart,
            bg: '#f5f3ff', // Violet 50
            border: '#ddd6fe',
            iconColor: '#8b5cf6',
            text: '#4c1d95',
            route: 'StudentDailyLog'
        },
        {
            title: 'İlaç\nTakibi',
            sub: 'Bildirim Yok',
            icon: Pill,
            bg: '#fff1f2', // Rose 50
            border: '#fecdd3',
            iconColor: '#f43f5e',
            text: '#881337',
            route: 'MedicationTracking'
        },
        {
            title: 'Duyurular',
            sub: 'Sınıf & Genel',
            icon: Palette,
            bg: '#f0fdf4', // Green 50
            border: '#bbf7d0',
            iconColor: '#16a34a',
            text: '#14532d',
            route: 'Announcements' // View Announcements list
        },
        {
            title: 'Yemek\nListesi',
            sub: 'Haftalık Menü',
            icon: Utensils,
            bg: '#f0f9ff', // Sky 50
            border: '#bae6fd',
            iconColor: '#0ea5e9',
            text: '#0c4a6e',
            route: 'FoodMenu'
        }
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* MATCHING HEADER */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ position: 'relative' }}>
                        <Image source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&q=80' }} style={{ width: 52, height: 52, borderRadius: 18, borderWidth: 3, borderColor: '#fff' }} />
                        <View style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, backgroundColor: '#22c55e', borderRadius: 7, borderWidth: 2, borderColor: 'white' }} />
                    </View>
                    <View style={{ marginLeft: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f97316', letterSpacing: 1 }}>{teacherClass?.name || 'SINIF ÖĞRETMENİ'}</Text>
                        <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#1e293b' }}>Merhaba, {user?.name?.split(' ')[0]}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
                    <LogOut size={22} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

                {/* ARRIVALS CARD - COMPACT */}
                <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                                <Bell size={16} color="#ef4444" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>Yolda Olanlar</Text>
                        </View>
                        {arrivals.length > 0 && (
                            <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>{arrivals.length} Kişi</Text>
                            </View>
                        )}
                    </View>

                    {arrivals.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 12, paddingVertical: 4 }}>Şu an yolda olan veli yok.</Text>
                    ) : (
                        <View style={{ gap: 8 }}>
                            {arrivals.map((arrival) => (
                                <View key={arrival.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: arrival.students?.color || '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ fontWeight: '700', color: 'white', fontSize: 11 }}>{arrival.students?.initials}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{arrival.students?.name}</Text>
                                            <Text style={{ fontSize: 10, color: '#64748b' }}>{arrival.students?.classes?.name}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>~{arrival.estimated_arrival_minutes} dk</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* MY CLASS CARD - COMPACT */}
                <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1, overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
                        <School size={100} color="#3b82f6" />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' }}>Sınıfım</Text>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e293b' }}>{teacherClass?.name || 'Sınıf Yok'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#3b82f6' }}>{students.length}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>ÖĞRENCİ</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('TeacherAttendance')} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }}>
                            <CheckSquare size={16} color="white" />
                            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>Yoklama Al</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateAnnouncement')} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#bfdbfe' }}>
                            <Megaphone size={16} color="#3b82f6" />
                            <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '700' }}>Duyuru Yap</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CURRENT ACTIVITY BANNER - COMPACT */}
                <LinearGradient colors={['#f59e0b', '#d97706']} style={{ padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#d97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4, overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', right: -20, top: -20, opacity: 0.15, transform: [{ rotate: '15deg' }] }}>
                        <Heart size={140} color="white" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 }}>
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>SINIF MODU</Text>
                    </View>
                    <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', lineHeight: 28, marginBottom: 8 }}>Serbest Oyun{"\n"}Zamanı</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={14} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, marginLeft: 6, fontWeight: '700', opacity: 0.9 }}>Bitiş: 11:30</Text>
                    </View>
                </LinearGradient>

                {/* ACTION GRID - COMPACT & SHARP */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => item.route && navigation.navigate(item.route)}
                            style={{
                                width: (width - 50) / 2,
                                height: 95,
                                backgroundColor: item.bg,
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 12,
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: item.border,
                                overflow: 'hidden',
                                shadowColor: item.iconColor,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.03,
                                shadowRadius: 4,
                                elevation: 1
                            }}
                        >
                            <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.08 }}>
                                <item.icon size={60} color={item.iconColor} />
                            </View>

                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: item.iconColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                                <item.icon size={18} color={item.iconColor} />
                            </View>

                            <Text style={{ fontSize: 13, fontWeight: '700', color: item.text }}>{item.title.replace('\n', ' ')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TeacherDashboardScreen;
