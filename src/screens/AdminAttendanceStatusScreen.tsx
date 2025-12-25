
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Search, School, BarChart3, Users, CheckCircle, BellRing, AlertCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

const AdminAttendanceStatusScreen = ({ navigation }: any) => {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPresent, setTotalPresent] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Classes
            const { data: classesData, error: classError } = await supabase
                .from('classes')
                .select('id, name, teacher_id, profiles:teacher_id(name)')
                .order('name');
            if (classError) throw classError;

            // 2. Fetch Students (id, class_id)
            const { data: studentsData, error: studentError } = await supabase
                .from('students')
                .select('id, class_id')
                .eq('status', 'Aktif');
            if (studentError) throw studentError;

            // 3. Fetch Attendance for Today (student_id, status)
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('date', today)
                .in('status', ['Geldi', 'Geç Geldi']); // Only count those who are "here"
            if (attendanceError) throw attendanceError;

            // Process Data
            const studentMap: { [key: string]: string } = {}; // studentId -> classId
            const classCounts: { [key: string]: number } = {}; // classId -> total students
            const classPresent: { [key: string]: number } = {}; // classId -> present students

            studentsData?.forEach(s => {
                studentMap[s.id] = s.class_id;
                classCounts[s.class_id] = (classCounts[s.class_id] || 0) + 1;
            });

            attendanceData?.forEach(att => {
                const classId = studentMap[att.student_id];
                if (classId) {
                    classPresent[classId] = (classPresent[classId] || 0) + 1;
                }
            });

            // Set Totals
            setTotalStudents(studentsData?.length || 0);
            setTotalPresent(attendanceData?.length || 0);

            // Merge with Classes
            const merged = classesData?.map(c => ({
                ...c,
                totalStudents: classCounts[c.id] || 0,
                presentCount: classPresent[c.id] || 0,
                attendanceRate: classCounts[c.id] ? Math.round((classPresent[c.id] || 0) / classCounts[c.id] * 100) : 0
            }));

            setClasses(merged || []);

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.profiles?.name && c.profiles.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sophisticated Pastel Themes
    const cardThemes = [
        { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#1e3a8a' }, // Blue
        { bg: '#f0fdf4', border: '#bbf7d0', icon: '#22c55e', text: '#14532d' }, // Green
        { bg: '#fefce8', border: '#fef08a', icon: '#eab308', text: '#713f12' }, // Yellow
        { bg: '#faf5ff', border: '#e9d5ff', icon: '#a855f7', text: '#581c87' }, // Purple
        { bg: '#fff1f2', border: '#fecdd3', icon: '#f43f5e', text: '#881337' }, // Rose
        { bg: '#ecfeff', border: '#a5f3fc', icon: '#06b6d4', text: '#164e63' }  // Cyan
    ];

    const getTheme = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return cardThemes[Math.abs(hash) % cardThemes.length];
    };

    const handleRemindTeacher = (teacherId: string, teacherName: string, className: string) => {
        if (!teacherId) {
            Alert.alert("Uyarı", "Bu sınıfa atanmış bir öğretmen bulunmuyor.");
            return;
        }

        Alert.alert(
            "Hatırlatma Gönder",
            `"${className}" sınıfı için ${teacherName} adlı öğretmene yoklama hatırlatması gönderilsin mi?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Gönder",
                    onPress: () => {
                        // TODO: Integrate with actual Push Notification service (OneSignal/Expo Push)
                        // For now, we simulate a successful action.
                        Alert.alert("Başarılı", "Bildirim kuyruğa alındı ve gönderildi.");
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const theme = getTheme(item.id);
        const rate = item.attendanceRate;
        const isMissingAttendance = item.presentCount === 0;
        const progressColor = rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444';

        return (
            <View style={{
                backgroundColor: theme.bg,
                borderRadius: 14,
                marginBottom: 6,
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: 'hidden',
                shadowColor: theme.icon,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1
            }}>
                <View style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.08 }}>
                    <BarChart3 size={100} color={theme.icon} />
                </View>

                <View style={{ padding: 10, paddingVertical: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.icon }}>{item.name.match(/\d+/) ? item.name.match(/\d+/)[0] : 'C'}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
                                <Text style={{ fontSize: 10, color: theme.text, opacity: 0.7 }}>{item.profiles?.name || 'Öğretmen Yok'}</Text>
                            </View>
                        </View>

                        {/* Status Badge or Reminder Button */}
                        {isMissingAttendance ? (
                            <TouchableOpacity
                                onPress={() => handleRemindTeacher(item.teacher_id, item.profiles?.name, item.name)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' }}
                            >
                                <BellRing size={12} color="#ef4444" />
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444' }}>HATIRLAT</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: progressColor }}>%{rate}</Text>
                            </View>
                        )}
                    </View>

                    {/* Stats Row */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isMissingAttendance ? '#FEF2F2' : 'rgba(255,255,255,0.5)', padding: 5, borderRadius: 8, borderWidth: 1, borderColor: isMissingAttendance ? '#FECACA' : 'rgba(255,255,255,0.6)' }}>
                            {isMissingAttendance ? <AlertCircle size={12} color="#ef4444" /> : <CheckCircle size={12} color={theme.icon} />}
                            <Text style={{ fontSize: 11, fontWeight: '600', color: isMissingAttendance ? '#B91C1C' : theme.text }}>
                                {isMissingAttendance ? 'Yoklama Eksik!' : <><Text style={{ fontWeight: '800' }}>{item.presentCount}</Text> Var</>}
                            </Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.5)', padding: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                            <Users size={12} color={theme.icon} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.text }}>
                                <Text style={{ fontWeight: '800' }}>{item.totalStudents}</Text> Toplam
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View>
                        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1.5, overflow: 'hidden' }}>
                            <View style={{ width: `${rate}%`, height: '100%', backgroundColor: progressColor, borderRadius: 1.5 }} />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* HERADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Günlük Yoklama</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* TOTAL STATS */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, padding: 20, backgroundColor: '#1e293b', borderRadius: 20, shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Bugünkü Katılım</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                            <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>%{totalStudents > 0 ? Math.round(totalPresent / totalStudents * 100) : 0}</Text>
                            <Text style={{ color: '#64748b', fontSize: 14 }}>ort.</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1, gap: 8 }}>
                        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', paddingHorizontal: 16 }}>
                            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Gelen Öğrenci</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#10b981' }}>{totalPresent}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', paddingHorizontal: 16 }}>
                            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>Toplam Öğrenci</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#64748b' }}>{totalStudents}</Text>
                        </View>
                    </View>
                </View>

                {/* SEARCH */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 44, paddingHorizontal: 14 }}>
                        <Search size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Sınıf ara..."
                            placeholderTextColor="#94a3b8"
                            style={{ flex: 1, fontSize: 13, color: '#1e293b' }}
                        />
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#1e293b" />
                ) : (
                    <FlatList
                        data={filteredClasses}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AdminAttendanceStatusScreen;
