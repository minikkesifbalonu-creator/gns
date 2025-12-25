import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Save, Lock, Moon, Utensils, ClipboardEdit, Sparkles, Smile, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StudentDailyLogScreen = ({ route, navigation }: any) => {
    // Initial student ID from navigation, but flexible to change
    const initialStudentId = route.params?.studentId;
    const { user } = useAuth();

    const [students, setStudents] = useState<any[]>([]);
    const [currentStudentId, setCurrentStudentId] = useState(initialStudentId);
    const [currentStudent, setCurrentStudent] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [loadingLog, setLoadingLog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [mood, setMood] = useState('Mutlu');
    const [sleep, setSleep] = useState('');
    const [notes, setNotes] = useState('');
    const [food, setFood] = useState({
        'Sabah Kahvaltısı': 'Hepsini Bitirdi',
        'Kuşluk Vakti': 'Hepsini Bitirdi',
        'Öğle Yemeği': 'Hepsini Bitirdi',
        'İkindi Kahvaltısı': 'Hepsini Bitirdi',
        'Meyve Saati': 'Hepsini Bitirdi'
    });
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (user) fetchClassAndStudents();
    }, [user]);

    useEffect(() => {
        if (currentStudentId) {
            fetchLogForStudent(currentStudentId);
            // Update current student object
            const found = students.find(s => s.id === currentStudentId);
            if (found) setCurrentStudent(found);
        }
    }, [currentStudentId, students]);

    const fetchClassAndStudents = async () => {
        try {
            setLoading(true);
            const { data: classData } = await supabase.from('classes').select('id').eq('teacher_id', user.id).maybeSingle();

            if (classData) {
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('class_id', classData.id)
                    .eq('status', 'Aktif')
                    .order('name');

                setStudents(studentsData || []);

                // If no initial student, select first one
                if (!currentStudentId && studentsData && studentsData.length > 0) {
                    setCurrentStudentId(studentsData[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogForStudent = async (studId: string) => {
        try {
            setLoadingLog(true);
            const today = new Date().toISOString().split('T')[0];
            const { data: logData } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('student_id', studId)
                .eq('date', today)
                .maybeSingle();

            if (logData) {
                setMood(logData.mood || 'Mutlu');
                setSleep(logData.sleep_duration || '');
                setNotes(logData.notes || '');
                if (logData.food_json) setFood(logData.food_json);
                setIsLocked(logData.is_locked || false);
            } else {
                // Reset form for new student entry
                setMood('Mutlu');
                setSleep('');
                setNotes('');
                setFood({
                    'Sabah Kahvaltısı': 'Hepsini Bitirdi',
                    'Kuşluk Vakti': 'Hepsini Bitirdi',
                    'Öğle Yemeği': 'Hepsini Bitirdi',
                    'İkindi Kahvaltısı': 'Hepsini Bitirdi',
                    'Meyve Saati': 'Hepsini Bitirdi'
                });
                setIsLocked(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLog(false);
        }
    };

    const handleSave = async () => {
        if (isLocked) {
            setIsLocked(false);
            return;
        }

        try {
            setSaving(true);
            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase
                .from('daily_logs')
                .upsert({
                    student_id: currentStudentId,
                    date: today,
                    mood,
                    food_json: food,
                    sleep_duration: sleep,
                    notes,
                    is_locked: true,
                    created_at: new Date().toISOString()
                }, { onConflict: 'student_id,date' });

            if (error) throw error;
            setIsLocked(true);
            Alert.alert('Başarılı', 'Günce kilitlendi ve kaydedildi.');
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Kaydedilirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const foodOptions = ['Hepsini Bitirdi', 'Yarısını Bitirdi', 'Az Yedi', 'Yemedi'];
    const moodOptions = [
        { label: 'Mutlu', emoji: '🤩' },
        { label: 'Normal', emoji: '🙂' },
        { label: 'Halsiz', emoji: '😐' },
        { label: 'Üzgün', emoji: '😢' }
    ];

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#3b82f6" size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>Günlük Günce</Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* STUDENT SELECTOR HORIZONTAL SCROLL */}
                <View style={{ paddingVertical: 16, backgroundColor: 'white' }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                        {students.map((stud) => {
                            const isSelected = stud.id === currentStudentId;
                            return (
                                <TouchableOpacity
                                    key={stud.id}
                                    onPress={() => setCurrentStudentId(stud.id)}
                                    style={{ alignItems: 'center', gap: 6, opacity: isSelected ? 1 : 0.6 }}
                                >
                                    <View style={{ position: 'relative' }}>
                                        <Image
                                            source={{ uri: stud.photo_url || `https://ui-avatars.com/api/?name=${stud.name}&background=random` }}
                                            style={{ width: 56, height: 56, borderRadius: 18, borderWidth: isSelected ? 3 : 1, borderColor: isSelected ? '#3b82f6' : '#f1f5f9' }}
                                        />
                                        {isSelected && (
                                            <View style={{ position: 'absolute', bottom: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' }}>
                                                <Check size={12} color="white" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? '#3b82f6' : '#64748b' }}>
                                        {stud.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
                    {loadingLog ? (
                        <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 16, textAlign: 'center' }}>
                                {currentStudent?.name} İçin Durum
                            </Text>

                            {/* MOOD */}
                            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                    <Smile size={20} color="#10b981" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b' }}>Ruh Hali Nasıl?</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {moodOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.label}
                                            disabled={isLocked}
                                            onPress={() => setMood(opt.label)}
                                            style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, borderWidth: 1, backgroundColor: mood === opt.label ? '#ecfdf5' : '#f8fafc', borderColor: mood === opt.label ? '#10b981' : '#f1f5f9' }}
                                        >
                                            <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 4, color: '#64748b' }}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* FOOD */}
                            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                    <Utensils size={20} color="#f97316" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b' }}>Beslenme Durumu</Text>
                                </View>
                                {Object.keys(food).map((meal) => (
                                    <View key={meal} style={{ marginBottom: 20 }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 12 }}>{meal}</Text>
                                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                            {foodOptions.map((opt: any) => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    disabled={isLocked}
                                                    onPress={() => setFood({ ...food, [meal]: opt })}
                                                    style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, backgroundColor: food[meal as keyof typeof food] === opt ? '#fff7ed' : '#ffffff', borderColor: food[meal as keyof typeof food] === opt ? '#f97316' : '#e2e8f0', flex: 1, alignItems: 'center' }}
                                                >
                                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: food[meal as keyof typeof food] === opt ? '#ea580c' : '#94a3b8', textAlign: 'center' }}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* SLEEP AND NOTES */}
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <View style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <Moon size={16} color="#6366f1" style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b' }}>UYKU</Text>
                                    </View>
                                    <TextInput
                                        value={sleep}
                                        onChangeText={setSleep}
                                        editable={!isLocked}
                                        placeholder="Süre (örn: 1s)"
                                        style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', padding: 0 }}
                                    />
                                </View>
                                <View style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                                    <Sparkles size={32} color="#f59e0b" opacity={0.5} />
                                    <Text style={{ fontSize: 10, marginTop: 4, color: '#94a3b8', fontWeight: 'bold' }}>İyi Geceler</Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 100 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <ClipboardEdit size={16} color="#64748b" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>GÜNÜN NOTU</Text>
                                </View>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    editable={!isLocked}
                                    multiline
                                    placeholder="Veli için kısa bir not..."
                                    style={{ fontSize: 14, fontWeight: '500', color: '#334155', padding: 0, minHeight: 60 }}
                                />
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* FLOATING SAVE BUTTON */}
                {!loadingLog && (
                    <View style={{ position: 'absolute', bottom: 24, alignSelf: 'center' }}>
                        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
                            <LinearGradient
                                colors={isLocked ? ['#ef4444', '#b91c1c'] : ['#3b82f6', '#2563eb']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {saving ? <ActivityIndicator color="white" size="small" /> : (
                                    <>
                                        {isLocked ? <Lock size={16} color="white" style={{ marginRight: 6 }} /> : <Save size={16} color="white" style={{ marginRight: 6 }} />}
                                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{isLocked ? 'KİLİDİ AÇ' : 'KAYDET & GÖNDER'}</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default StudentDailyLogScreen;
