import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, School, Users, User, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../supabaseStorage';

const CreateClassScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [capacity, setCapacity] = useState(15);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, name, branch')
            .eq('role', 'teacher')
            .order('name');
        setTeachers(data || []);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'Lütfen sınıf adını giriniz.');
            return;
        }

        setLoading(true);
        try {
            // Attempt to derive level from name (e.g. 1-A => 1)
            // If parse fails, default to 1 (or handle differently)
            const levelMatch = name.match(/(\d+)/);
            const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

            const { error } = await supabase
                .from('classes')
                .insert({
                    name: name.trim(),
                    teacher_id: teacherId,
                    level: level,
                    status: 'Aktif',
                    capacity: capacity
                });

            if (error) throw error;

            Alert.alert('Başarılı', 'Sınıf oluşturuldu.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Hata', 'Sınıf oluşturulurken bir hata oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedTeacher = teachers.find(t => t.id === teacherId);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* HEADER - Sharp & Minimalist */}
            <View style={{ padding: 20, paddingTop: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Yeni Sınıf Oluştur</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                    {/* MAIN CARD - Sharp & Web-like */}
                    <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', padding: 24, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <View style={{ width: 44, height: 44, backgroundColor: '#eff6ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <School size={22} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}>Sınıf Bilgileri</Text>
                                <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20 }}>
                                    Lütfen oluşturmak istediğiniz sınıfın adını (Örn: 1-A) ve sınıf öğretmenini belirtiniz.
                                </Text>
                            </View>
                        </View>

                        <View style={{ gap: 24 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Sınıf Adı</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Örn: 1-A"
                                    placeholderTextColor="#94a3b8"
                                    style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc' }}
                                />
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Sınıf Kapasitesi</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <TouchableOpacity onPress={() => setCapacity(Math.max(1, capacity - 1))} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                        <Text style={{ fontSize: 20, color: '#334155' }}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>{capacity} Öğrenci</Text>
                                    <TouchableOpacity onPress={() => setCapacity(Math.min(30, capacity + 1))} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                        <Text style={{ fontSize: 20, color: '#334155' }}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Sınıf Öğretmeni (Opsiyonel)</Text>
                                <TouchableOpacity
                                    onPress={() => setShowTeacherModal(true)}
                                    style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    {selectedTeacher ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={16} color="#3b82f6" />
                                            </View>
                                            <Text style={{ fontSize: 15, color: '#1e293b', fontWeight: '500' }}>{selectedTeacher.name}</Text>
                                        </View>
                                    ) : (
                                        <Text style={{ fontSize: 15, color: '#94a3b8' }}>Öğretmen Seçiniz...</Text>
                                    )}
                                    <ChevronLeft size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* ACTION BUTTON */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        style={{ marginTop: 24, backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <Save size={20} color="white" strokeWidth={2} />
                                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white', letterSpacing: 0.5 }}>KAYDET VE OLUŞTUR</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* TEACHER SELECTION MODAL */}
            <Modal visible={showTeacherModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                    <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b' }}>Öğretmen Seç</Text>
                        <TouchableOpacity onPress={() => setShowTeacherModal(false)} style={{ padding: 4 }}>
                            <Text style={{ color: '#3b82f6', fontWeight: '600' }}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {teachers.map(teacher => (
                            <TouchableOpacity
                                key={teacher.id}
                                onPress={() => {
                                    setTeacherId(teacher.id);
                                    setShowTeacherModal(false);
                                }}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: teacherId === teacher.id ? '#3b82f6' : '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontWeight: '600', color: '#64748b' }}>{teacher.name.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }}>{teacher.name}</Text>
                                        <Text style={{ fontSize: 12, color: '#64748b' }}>{teacher.branch || 'Branş Yok'}</Text>
                                    </View>
                                </View>
                                {teacherId === teacher.id && <CheckCircle2 size={20} color="#3b82f6" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CreateClassScreen;
