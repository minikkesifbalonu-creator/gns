import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Check, X, Clock, Save, User } from 'lucide-react-native';

type AttendanceStatus = 'present' | 'absent' | 'late';

const TeacherAttendanceScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teacherClass, setTeacherClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [teacherProfile, setTeacherProfile] = useState<any>(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get Teacher Profile
            const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setTeacherProfile(pData || {});

            // 2. Get Class
            const { data: classData } = await supabase
                .from('classes')
                .select('*')
                .eq('teacher_id', user.id)
                .single();

            if (classData) {
                setTeacherClass(classData);

                // 3. Get Students
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('class_id', classData.id)
                    .eq('status', 'Aktif')
                    .order('name');

                const studentList = studentsData || [];
                setStudents(studentList);

                // 4. Get Today's Attendance
                const today = new Date().toISOString().split('T')[0];
                const { data: attData } = await supabase
                    .from('attendance')
                    .select('student_id, status')
                    .eq('date', today)
                    .in('student_id', studentList.map(s => s.id));

                const initialMap: Record<string, AttendanceStatus> = {};
                studentList.forEach(s => {
                    initialMap[s.id] = 'present';
                });

                if (attData) {
                    attData.forEach((a: any) => {
                        if (a.status === 'Geldi') initialMap[a.student_id] = 'present';
                        else if (a.status === 'Gelmedi') initialMap[a.student_id] = 'absent';
                        else if (a.status === 'Geç Geldi') initialMap[a.student_id] = 'late';
                    });
                }
                setAttendance(initialMap);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Veriler yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: string) => {
        setAttendance(prev => {
            const current = prev[studentId];
            let next: AttendanceStatus = 'present';
            if (current === 'present') next = 'absent';
            else if (current === 'absent') next = 'late';
            else next = 'present';
            return { ...prev, [studentId]: next };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const today = new Date().toISOString().split('T')[0];

            const records = students.map(s => {
                const status = attendance[s.id];
                let dbStatus = 'Geldi';
                if (status === 'absent') dbStatus = 'Gelmedi';
                if (status === 'late') dbStatus = 'Geç Geldi';

                return {
                    student_id: s.id,
                    class_id: teacherClass.id,
                    date: today,
                    status: dbStatus,
                    updated_at: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from('attendance')
                .upsert(records, { onConflict: 'student_id,date' });

            if (error) throw error;

            Alert.alert('Başarılı', 'Yoklama kaydedildi!', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            console.error(error);
            Alert.alert('Hata', 'Kaydedilemedi: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusStyle = (status: AttendanceStatus) => {
        switch (status) {
            case 'present': return { border: '#10b981', text: '#10b981', label: 'BURADA' }; // Emerald-500
            case 'absent': return { border: '#ef4444', text: '#ef4444', label: 'YOK' };     // Red-500
            case 'late': return { border: '#f59e0b', text: '#f59e0b', label: 'GEÇ' };        // Amber-500
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0f172a" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* MINIMALIST HEADER */}
            <View style={{ paddingTop: 20, paddingBottom: 16, paddingHorizontal: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                        <ChevronLeft size={24} color="#0f172a" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', letterSpacing: -0.5 }}>SINIF YOKLAMASI</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={{ marginTop: 24 }}>
                    <Text style={{ fontSize: 32, fontWeight: '300', color: '#0f172a', letterSpacing: -1 }}>
                        {teacherClass?.name || 'Sınıf Yok'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ACTIONS */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => {
                            const allPresent: Record<string, AttendanceStatus> = {};
                            students.forEach(s => allPresent[s.id] = 'present');
                            setAttendance(allPresent);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}
                    >
                        <Check size={14} color="#0f172a" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#0f172a' }}>TÜMÜ VAR</Text>
                    </TouchableOpacity>
                </View>

                {/* SHARP LIST */}
                <View style={{ gap: -1 }}>
                    {students.map((student) => {
                        const status = attendance[student.id] || 'present';
                        const style = getStatusStyle(status);

                        return (
                            <TouchableOpacity
                                key={student.id}
                                onPress={() => toggleStatus(student.id)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: 'white',
                                    paddingVertical: 16,
                                    paddingHorizontal: 4,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#f1f5f9'
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                    <Image
                                        source={{ uri: student.photo_url || `https://ui-avatars.com/api/?name=${student.name}&background=0f172a&color=fff` }}
                                        style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: '#f8fafc' }}
                                    />
                                    <View>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>{student.name}</Text>
                                        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>#{student.display_id || 'ID'}</Text>
                                    </View>
                                </View>

                                <View style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderWidth: 1,
                                    borderColor: style.border,
                                    borderRadius: 4,
                                    minWidth: 80,
                                    alignItems: 'center'
                                }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: style.text, letterSpacing: 0.5 }}>
                                        {style.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* SAVE BUTTON AT BOTTOM OF LIST */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                        marginTop: 40,
                        backgroundColor: '#0f172a', // Slate-900 (Dark)
                        borderRadius: 4, // Sharp
                        paddingVertical: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8
                    }}
                >
                    {saving ? <ActivityIndicator color="white" size="small" /> : (
                        <>
                            <Save size={18} color="white" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: 'white', letterSpacing: 1 }}>KAYDET</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default TeacherAttendanceScreen;
