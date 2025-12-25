import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { LogOut, Bell, ChevronRight, User, Users, School, Lock, Utensils, LayoutGrid, BarChart3, Megaphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const [arrivals, setArrivals] = useState<any[]>([]);
    const [pendingAnnouncements, setPendingAnnouncements] = useState(0);
    const [attendanceRate, setAttendanceRate] = useState(0);
    const [loading, setLoading] = useState(true);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchData();
        startPulse();
    }, []);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    };

    const fetchData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Arrivals
            const { data: arrivalData } = await supabase
                .from('arrivals')
                .select('*, students(name, initials, color, classes(name))')
                .eq('status', 'coming')
                .gte('created_at', today);
            setArrivals(arrivalData || []);

            // Pending Announcements
            const { count } = await supabase
                .from('announcements')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Onay Bekliyor');
            setPendingAnnouncements(count || 0);

            // Attendance Rate (Actual Attendance Table)
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            const { count: presentCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .in('status', ['Geldi', 'Geç Geldi']); // Count both present and late as "here"

            if (studentCount && studentCount > 0) {
                setAttendanceRate(Math.round(((presentCount || 0) / studentCount) * 100));
            } else {
                setAttendanceRate(0);
            }

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Sophisticated Pastel Themes for Menu
    // These match the visual language of AdminClassManagement
    const menuItems = [
        {
            title: 'Öğrenci\nYönetimi',
            icon: Users,
            bg: '#f0f9ff', // Sky 50
            border: '#bae6fd',
            iconColor: '#0ea5e9',
            text: '#0c4a6e',
            route: 'AdminStudentManagement'
        },
        {
            title: 'Öğretmen\nYönetimi',
            icon: User,
            bg: '#fff7ed', // Orange 50
            border: '#fed7aa',
            iconColor: '#f97316',
            text: '#7c2d12',
            route: 'AdminTeacherManagement'
        },
        {
            title: 'Sınıf\nYönetimi',
            icon: School,
            bg: '#ecfdf5', // Emerald 50
            border: '#a7f3d0',
            iconColor: '#10b981',
            text: '#064e3b',
            route: 'AdminClassManagement'
        },
        {
            title: 'Hesap & Şifre\nİşlemleri',
            icon: Lock,
            bg: '#f5f3ff', // Violet 50
            border: '#ddd6fe',
            iconColor: '#8b5cf6',
            text: '#4c1d95',
            route: 'AdminAccountManagement'
        },
        {
            title: 'Yemek Menüsü\nYönetimi',
            icon: Utensils,
            bg: '#fefce8', // Yellow 50
            border: '#fde047',
            iconColor: '#eab308',
            text: '#713f12',
            route: 'FoodMenu'
        },
        {
            title: 'Duyuru\nYönetimi',
            icon: Megaphone,
            bg: '#fff1f2', // Rose 50
            border: '#fecdd3',
            iconColor: '#f43f5e',
            text: '#881337',
            route: 'AdminAnnouncementManagement',
            badge: pendingAnnouncements > 0 ? pendingAnnouncements : null
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* WEB-STYLE HEADER */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ position: 'relative' }}>
                        <Image source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&q=80' }} style={{ width: 52, height: 52, borderRadius: 18, borderWidth: 3, borderColor: '#fff' }} />
                        <View style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, backgroundColor: '#3b82f6', borderRadius: 7, borderWidth: 2, borderColor: 'white' }} />
                    </View>
                    <View style={{ marginLeft: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 }}>YÖNETİCİ PANELİ</Text>
                        <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#1e293b' }}>{user?.name || 'Yönetici'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <LogOut size={22} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

                {/* ARRIVALS CARD - ALWAYS VISIBLE */}
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

                {/* GRID MENU - COMPACT & SHARP */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => item.route && navigation.navigate(item.route)}
                            style={{
                                width: (width - 50) / 2,
                                height: 95, // Reduced from 140
                                backgroundColor: item.bg,
                                borderRadius: 16, // Sharper (was 28)
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
                            {/* Decorative Icon - Adjusted position */}
                            <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.08 }}>
                                <item.icon size={60} color={item.iconColor} />
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: item.iconColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                                    <item.icon size={18} color={item.iconColor} />
                                </View>
                                {item.badge && (
                                    <View style={{ backgroundColor: '#ef4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: 'white' }}>
                                        <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>{item.badge}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: item.text }}>{item.title.replace('\n', ' ')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* PROGRESS CARD - COMPACT */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminAttendanceStatus')}
                    style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1, overflow: 'hidden' }}
                >
                    <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03 }}>
                        <BarChart3 size={80} color="#3b82f6" />
                    </View>
                    <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 4, borderColor: '#f1f5f9', borderTopColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>%{attendanceRate}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b' }}>Günlük Yoklama</Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{attendanceRate > 0 ? `%${attendanceRate} katılım` : 'Henüz veri yok'}.</Text>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AdminDashboardScreen;
