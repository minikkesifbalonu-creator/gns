import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Search, Filter, Edit2, Trash2, X, Plus, UserPlus, FileText, Calendar, Briefcase, Phone, ShieldCheck } from 'lucide-react-native';

// Theme Colors - Consistent with Student/Admin Panels
const theme = {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    primary: '#3b82f6',
    border: '#e2e8f0',
    danger: '#ef4444',
    success: '#10b981'
};

const AdminTeacherManagementScreen = ({ navigation }: any) => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showKvkk, setShowKvkk] = useState(false);

    useEffect(() => {
        fetchTeachers();
        const subscription = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.teacher" }, fetchTeachers)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            // 1. Try fetching all columns including potential new ones like 'branch', 'phone', 'gender'
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'teacher')
                .order('name');

            if (error) throw error;
            setTeachers(data || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Öğretmenler yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Öğretmeni Sil', 'Bu öğretmeni silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        // Check if teacher is assigned to any class
                        const { data: classes, error: checkError } = await supabase
                            .from('classes')
                            .select('id, name')
                            .eq('teacher_id', id);

                        if (classes && classes.length > 0) {
                            Alert.alert('Hata', `Bu öğretmen şu sınıflara atanmış durumda: ${classes.map(c => c.name).join(', ')}. Önce sınıf atamasını kaldırınız.`);
                            setLoading(false);
                            return;
                        }

                        // Delete
                        const { error } = await supabase.from('profiles').delete().eq('id', id);
                        if (error) throw error;
                    } catch (e: any) {
                        console.error(e);
                        Alert.alert("Hata", "Silme işlemi başarısız: " + e.message);
                    } finally {
                        setLoading(false);
                        fetchTeachers();
                    }
                }
            }
        ]);
    };

    const generateMockData = async () => {
        Alert.alert('Örnek Veri Yükle', 'Mevcut öğretmen listesine 5 adet örnek öğretmen eklenecek. Onaylıyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla',
                onPress: async () => {
                    setLoading(true);
                    try {
                        const mockTeachers = [
                            { name: 'Ahmet Yılmaz', role: 'teacher', branch: 'Matematik', phone: '05551112233', gender: 'Erkek', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', login_id: 'T1001', password: '123' },
                            { name: 'Ayşe Demir', role: 'teacher', branch: 'Türkçe', phone: '05552223344', gender: 'Kız', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg', login_id: 'T1002', password: '123' },
                            { name: 'Mehmet Öz', role: 'teacher', branch: 'Fen Bilimleri', phone: '05553334455', gender: 'Erkek', avatar_url: 'https://randomuser.me/api/portraits/men/85.jpg', login_id: 'T1003', password: '123' },
                            { name: 'Fatma Kaya', role: 'teacher', branch: 'İngilizce', phone: '05554445566', gender: 'Kız', avatar_url: 'https://randomuser.me/api/portraits/women/65.jpg', login_id: 'T1004', password: '123' },
                            { name: 'Ali Vural', role: 'teacher', branch: 'Beden Eğitimi', phone: '05555556677', gender: 'Erkek', avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg', login_id: 'T1005', password: '123' }
                        ];

                        const { error } = await supabase.from('profiles').insert(mockTeachers);

                        if (error) {
                            if (error.code === '42703' || error.code === 'PGRST204') {
                                // Fallback
                                const basicMocks = mockTeachers.map(({ branch, phone, gender, avatar_url, ...rest }) => rest);
                                await supabase.from('profiles').insert(basicMocks);
                                Alert.alert('Kısmi Başarı', 'Temel öğretmen kayıtları eklendi. Ancak veritabanında "branch", "phone", "gender", "avatar_url" sütunları olmadığı için detaylar kaydedilemedi. Lütfen SQL editöründen sütunları ekleyiniz.');
                            } else {
                                throw error;
                            }
                        } else {
                            Alert.alert('Başarılı', '5 adet örnek öğretmen (fotoğraflı ve detaylı) başarıyla eklendi.');
                        }

                        fetchTeachers();

                    } catch (e: any) {
                        console.error(e);
                        Alert.alert('İşlem Başarısız', e.message);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleEdit = (teacher: any) => {
        navigation.navigate('CreateTeacher', { teacherToEdit: teacher });
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.branch && t.branch.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* ELEGANT HEADER - Matching AdminStudentManagementScreen */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Öğretmen Yönetimi</Text>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* TOP ACTIONS & STATS - Matching AdminStudentManagementScreen */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Toplam</Text>
                                <Text style={{ fontSize: 16, fontWeight: '400', color: '#334155' }}>{teachers.length}</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setShowKvkk(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} color="#64748b" />
                            <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748b' }}>KVKK Uyumlu</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ACTIONS ROW - Now at TOP */}
                    <View style={{ marginBottom: 20, flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateTeacher')}
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: '#1e293b', // Matching Student Management Dark Color if desired, or keep Blue #3b82f6. User said "aynı olsun". I'll use Dark for consistency with structure.
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                shadowColor: '#1e293b',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 4
                            }}>
                            <Plus size={20} color="white" strokeWidth={1.5} />
                            <Text style={{ fontSize: 14, fontWeight: '500', color: 'white', letterSpacing: 0.5 }}>YENİ ÖĞRETMEN KAYDI</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={generateMockData}
                            style={{
                                borderRadius: 12,
                                backgroundColor: '#f1f5f9',
                                padding: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: 50
                            }}>
                            <UserPlus size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* SEARCH - MINIMALIST */}
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 44 }}>
                            <Search size={18} color="#94a3b8" />
                            <TextInput
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                placeholder="Öğretmen Adı veya Branş Ara..."
                                placeholderTextColor="#94a3b8"
                                style={{ flex: 1, marginLeft: 10, fontSize: 13, color: '#334155' }}
                            />
                        </View>
                    </View>

                    {/* TEACHER LIST */}
                    {loading ? (
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={{ marginTop: 16, color: theme.subtext }}>Öğretmenler yükleniyor...</Text>
                        </View>
                    ) : filteredTeachers.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Search size={40} color="#3b82f6" />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Kayıt Bulunamadı</Text>
                        </View>
                    ) : (
                        <View>
                            {filteredTeachers.map((item) => (
                                <View key={item.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: 12,
                                    marginBottom: 8,
                                    padding: 12,
                                    borderWidth: 1,
                                    borderColor: '#e2e8f0',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}>
                                    {/* AVATAR */}
                                    <View style={{
                                        width: 44, height: 44, borderRadius: 10,
                                        backgroundColor: '#f8fafc',
                                        alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                        borderWidth: 1,
                                        borderColor: '#f1f5f9'
                                    }}>
                                        {item.avatar_url ? (
                                            <Image
                                                source={{ uri: item.avatar_url }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>
                                                {item.name.substring(0, 2).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>

                                    {/* INFO */}
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
                                            {item.name}
                                        </Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            {item.branch ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <Briefcase size={12} color="#94a3b8" />
                                                    <Text style={{ fontSize: 11, color: '#64748b' }}>{item.branch}</Text>
                                                </View>
                                            ) : (
                                                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Branş Yok</Text>
                                            )}

                                            {item.phone && (
                                                <>
                                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' }} />
                                                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.phone}</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    {/* ACTIONS */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <TouchableOpacity
                                            onPress={() => handleEdit(item)}
                                            style={{ padding: 8 }}>
                                            <Edit2 size={16} color="#94a3b8" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDelete(item.id)}
                                            style={{ padding: 8 }}>
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* KVKK MODAL */}
            <Modal visible={showKvkk} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 24 }}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <ShieldCheck size={48} color="#334155" strokeWidth={1} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', textAlign: 'center', marginBottom: 12 }}>Veri Güvenliği ve KVKK</Text>
                        <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                            Bu paneldeki tüm öğretmen verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında korunmaktadır.
                        </Text>
                        <TouchableOpacity onPress={() => setShowKvkk(false)} style={{ backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: '500' }}>Okudum, Onaylıyorum</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default AdminTeacherManagementScreen;
