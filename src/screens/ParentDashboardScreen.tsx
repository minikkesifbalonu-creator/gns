import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { LogOut, Car, Sparkles, Utensils, Moon, Palette, ChevronRight, Bell, Heart, Star, LayoutGrid, School } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ParentDashboardScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const [isComing, setIsComing] = useState(false);
    const [loadingComing, setLoadingComing] = useState(false);
    const [dailyLog, setDailyLog] = useState<any>(null);
    const [loadingLog, setLoadingLog] = useState(true);
    const [myChild, setMyChild] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchChildInfo();
    }, [user]);

    useEffect(() => {
        if (myChild?.id) {
            fetchArrivalStatus();
            fetchDailyLog();
            fetchAnnouncements(myChild.class_id);
            fetchAttendance();
        }
    }, [myChild?.id]);

    const fetchAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', myChild.id)
                .eq('date', today)
                .maybeSingle();

            if (data) setAttendanceStatus(data.status);
            else setAttendanceStatus('Yoklama Alınmadı');
        } catch (e) { console.error(e); }
    };

    const fetchChildInfo = async () => {
        try {
            // Priority 1: If we have a targetId (from admin/teacher view)
            if (user.targetId) {
                const { data } = await supabase.from('students').select(`
                    *,
                    classes (
                        id, 
                        name,
                        profiles:teacher_id (name)
                    )
                `).eq('id', user.targetId).maybeSingle();
                if (data) setMyChild(data);
                return;
            }

            // Priority 2: Try parent_id (if already linked)
            const { data: byId } = await supabase.from('students').select(`
                *,
                classes (
                    id, 
                    name,
                    profiles:teacher_id (name)
                )
            `).eq('parent_id', user.id).maybeSingle();

            if (byId) {
                setMyChild(byId);
                return;
            }

            // Priority 3: Fallback to parent_name matching user.name (Common for synced parents)
            if (user.role === 'parent') {
                const { data: byName } = await supabase.from('students').select(`
                    *,
                    classes (
                        id, 
                        name,
                        profiles:teacher_id (name)
                    )
                `).eq('parent_name', user.name).maybeSingle();

                if (byName) {
                    setMyChild(byName);
                    // Proactive: Update parent_id for next time
                    await supabase.from('students').update({ parent_id: user.id }).eq('id', byName.id);
                }
            }
        } catch (error) { console.error("fetchChildInfo Error:", error); }
    };

    const fetchAnnouncements = async (classId?: string) => {
        try {
            let query = supabase.from('announcements').select('*, id').eq('status', 'Yayınlandı');
            if (classId) {
                query = query.or(`target_audience.eq.all,target_class_id.eq.${classId}`);
            } else {
                query = query.eq('target_audience', 'all');
            }
            const { data: allMsgs } = await query;
            const allIds = allMsgs?.map(m => m.id) || [];
            const { data: reads } = await supabase.from('announcement_reads').select('announcement_id').eq('user_id', user.id);
            const readIds = reads?.map(r => r.announcement_id) || [];
            const unreadCount = allIds.filter(id => !readIds.includes(id)).length;

            const { data: latestData } = await (supabase.from('announcements').select('*').eq('status', 'Yayınlandı'))
                .or(classId ? `target_audience.eq.all,target_class_id.eq.${classId}` : 'target_audience.eq.all')
                .order('publish_time', { ascending: false })
                .limit(1);

            if (latestData && latestData.length > 0) {
                latestData[0].unreadCount = unreadCount;
                setAnnouncements(latestData);
            }
        } catch (error) { console.error(error); }
    };

    const fetchArrivalStatus = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('arrivals').select('*').eq('student_id', myChild.id).gte('created_at', today).maybeSingle();
        if (data) setIsComing(true);
    };

    const fetchDailyLog = async () => {
        try {
            setLoadingLog(true);
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('daily_logs').select('*').eq('student_id', myChild.id).eq('date', today).maybeSingle();
            if (data) setDailyLog(data);
        } finally { setLoadingLog(false); }
    };

    const handleArrival = async (min: number) => {
        setLoadingComing(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('arrivals').delete().eq('student_id', myChild.id).gte('created_at', today);
            await supabase.from('arrivals').insert({ student_id: myChild.id, parent_id: user.id, status: 'coming', estimated_arrival_minutes: min });
            setIsComing(true);
        } finally { setLoadingComing(false); }
    };

    const cancelArrival = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('arrivals').delete().eq('student_id', myChild.id).gte('created_at', today);
            setIsComing(false);
        } finally { }
    };

    // Helper for Gender Based Colors
    const getGenderStyle = () => {
        if (myChild?.gender === 'Kız') return { bg: '#fff1f2', text: '#f43f5e', border: '#fecdd3', gradient: ['#fb7185', '#fda4af'] };
        if (myChild?.gender === 'Erkek') return { bg: '#f0f9ff', text: '#0ea5e9', border: '#bae6fd', gradient: ['#38bdf8', '#7dd3fc'] };
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', gradient: ['#94a3b8', '#cbd5e1'] };
    };

    const genderStyle = getGenderStyle();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fcfcfd' }}>
            {/* COMPACT HEADER */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=256&h=256&q=80' }} style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: '#f0f9ff' }} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5 }}>VELİ PANELİ</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#1e293b' }}>{user?.name || 'Veli'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={18} color="#f43f5e" />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

                {/* REFINED CHILD CARD */}
                <View style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: 'white', borderWidth: 1, borderColor: genderStyle.border, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
                    <LinearGradient colors={genderStyle.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: 'white', padding: 2 }}>
                                    {myChild?.image_url || myChild?.photo_url ? (
                                        <Image source={{ uri: myChild.image_url || myChild.photo_url }} style={{ flex: 1, borderRadius: 8 }} />
                                    ) : (
                                        <View style={{ flex: 1, borderRadius: 8, backgroundColor: genderStyle.bg, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: genderStyle.text, fontSize: 16, fontWeight: '900' }}>{myChild?.initials || '??'}</Text>
                                        </View>
                                    )}
                                </View>
                                <View>
                                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: -0.3 }}>{myChild?.name || 'Öğrenci Bulunamadı'}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                        <School size={10} color="white" style={{ opacity: 0.9 }} />
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '700', marginLeft: 4, opacity: 0.9 }}>
                                            {myChild?.classes?.name || 'Sınıf Tanımlı Değil'}
                                        </Text>
                                    </View>
                                    {myChild?.classes?.profiles?.name && (
                                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '500', opacity: 0.8, marginTop: 1 }}>
                                            👨‍🏫 {myChild.classes.profiles.name}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: attendanceStatus === 'Geldi' ? '#10b981' : '#f43f5e', fontSize: 8, fontWeight: '900' }}>{attendanceStatus?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* ARRIVAL NOTIFICATION - ELEGANT STYLE */}
                <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isComing ? '#dcfce7' : '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Car size={16} color={isComing ? '#22c55e' : '#94a3b8'} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b' }}>{isComing ? 'Yoldayız' : 'Okula Geliyoruz'}</Text>
                                <Text style={{ fontSize: 10, color: '#94a3b8' }}>Varış bildirimi gönderin.</Text>
                            </View>
                        </View>
                        {isComing && (
                            <TouchableOpacity onPress={cancelArrival} style={{ backgroundColor: '#fff1f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: '#f43f5e', fontSize: 9, fontWeight: '900' }}>İPTAL</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {!isComing ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[5, 10, 15, 20].map(min => (
                                <TouchableOpacity key={min} onPress={() => handleArrival(min)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fcfcfd', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#334155' }}>{min}</Text>
                                        <Text style={{ fontSize: 7, fontWeight: '900', color: '#94a3b8', marginLeft: 2 }}>DK</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 3, borderLeftColor: '#22c55e' }}>
                            <Bell size={14} color="#22c55e" />
                            <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>Öğretmeninize varış bilgisi iletildi.</Text>
                        </View>
                    )}
                </View>

                {/* REFINED ACTION BUTTONS */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ParentActivityFlow')}
                        style={{ flex: 1, height: 90, borderRadius: 20, backgroundColor: '#f5f3ff', padding: 16, justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#ede9fe' }}
                    >
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={16} color="#8b5cf6" />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#5b21b6' }}>GÜNLÜK KARNE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('FoodMenu')}
                        style={{ flex: 1, height: 90, borderRadius: 20, backgroundColor: '#fefce8', padding: 16, justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#fef9c3' }}
                    >
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                            <Utensils size={16} color="#eab308" />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#854d0e' }}>YEMEK MENÜSÜ</Text>
                    </TouchableOpacity>
                </View>

                {/* ANNOUNCEMENT SECTION */}
                {announcements.length > 0 && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Announcements')}
                        style={{ padding: 16, borderRadius: 20, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#eff6ff', borderLeftWidth: 5, borderLeftColor: '#3b82f6', marginBottom: 30 }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Bell size={14} color="#3b82f6" fill={(announcements[0]?.unreadCount || 0) > 0 ? "#3b82f6" : "none"} />
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 0.8 }}>SON DUYURU</Text>
                            </View>
                            {(announcements[0]?.unreadCount || 0) > 0 && (
                                <View style={{ backgroundColor: '#f43f5e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 8, fontWeight: '900', color: 'white' }}>{announcements[0].unreadCount} YENİ</Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e3a8a' }}>{announcements[0].title}</Text>
                        <Text style={{ fontSize: 10, color: '#60a5fa', marginTop: 2 }}>{announcements[0].content?.substring(0, 40)}...</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ParentDashboardScreen;
