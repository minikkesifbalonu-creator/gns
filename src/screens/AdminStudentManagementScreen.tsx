import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Search, Filter, Edit2, Trash2, X, Plus, UserPlus, Lock, ShieldCheck, FileText } from 'lucide-react-native';

const AdminStudentManagementScreen = ({ navigation }: any) => {
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showKvkk, setShowKvkk] = useState(false);

    // Edit Modal State
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');

    useEffect(() => {
        fetchStudents();
        fetchClasses();
        // Subscribe to real-time changes
        const subscription = supabase
            .channel('students_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
                fetchStudents();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name').order('name');
        setClasses(data || []);
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // 1. Attempt to fetch ALL fields (including new ones)
            const queryOriginal = `
                id,
                display_id,
                name,
                status,
                initials,
                color,
                gender,
                parent_name,
                parent_phone,
                birth_date,
                medical_info,
                medications,
                image_url,
                created_at,
                classes (
                    name,
                    teacher_id
                ),
                profiles (name)
            `;

            let { data, error } = await supabase
                .from('students')
                .select(queryOriginal)
                .order('created_at', { ascending: false });

            // 2. Fallback to basic fields if schema is outdated
            if (error && (error.code === '42703' || error.code === 'PGRST204')) {
                console.log('Schema mismatch, fetching basic fields only.');
                const { data: basicData, error: basicError } = await supabase
                    .from('students')
                    .select(`
                        id,
                        display_id,
                        name,
                        status,
                        initials,
                        color,
                        created_at,
                        classes (
                            name,
                            teacher_id
                        ),
                        profiles (name)
                    `)
                    .order('created_at', { ascending: false });

                if (basicError) throw basicError;
                data = basicData as any;
                error = null;
            } else if (error) {
                throw error;
            }

            // Since we can't easily fetch 'teacher.name' via deep joining if relations aren't perfect, 
            // we will fetch all teachers separately and map them. This is safer for loose schemas.
            const { data: teachersData } = await supabase.from('profiles').select('id, name').eq('role', 'teacher');
            const teacherMap = new Map();
            teachersData?.forEach((t: any) => teacherMap.set(t.id, t.name));

            // Enrich data with teacher name
            const enrichedData = (data || []).map((student: any) => {
                const teacherId = student.classes?.teacher_id;
                const teacherName = teacherId ? teacherMap.get(teacherId) : null;
                return { ...student, teacher_name: teacherName };
            });

            setStudents(enrichedData);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Kaydı Sil', 'Bu öğrenci kaydını ve geçmiş tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        // 1. Delete dependent logs and attendance
                        await supabase.from('daily_logs').delete().eq('student_id', id);
                        await supabase.from('attendance').delete().eq('student_id', id);

                        // 2. Delete student
                        const { error } = await supabase.from('students').delete().eq('id', id);
                        if (error) throw error;
                    } catch (e: any) {
                        console.error(e);
                        Alert.alert("Hata", "Silme işlemi başarısız: " + e.message);
                    } finally {
                        setLoading(false);
                        fetchStudents();
                    }
                }
            }
        ]);
    };

    const generateMockData = async () => {
        Alert.alert('Eski Verileri Sil ve Örnek Veri Yükle', 'Mevcut tüm öğrencileri ve günlük kayıtlarını silip yerine 5 adet örnek öğrenci eklenecek. Onaylıyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Onayla',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        // 1. Delete dependents first (logs AND attendance)
                        await supabase.from('daily_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');

                        // 2. Delete all students
                        const { error: deleteError } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        if (deleteError) throw deleteError;

                        // 3. Insert 5 Mock Students
                        let targetClassId = null;
                        if (classes.length > 0) targetClassId = classes[0].id;
                        else {
                            const { data: cls } = await supabase.from('classes').select('id').limit(1);
                            if (cls && cls.length > 0) targetClassId = cls[0].id;
                        }

                        if (!targetClassId) {
                            Alert.alert('Hata', 'Örnek veri için sistemde en az bir sınıf olmalıdır.');
                            setLoading(false);
                            return;
                        }

                        const mockStudents = [
                            { name: 'Ayşe Yılmaz', display_id: '1001', initials: 'AY', color: 'purple', status: 'Aktif', class_id: targetClassId, parent_name: 'Fatma Yılmaz', gender: 'Kız', parent_phone: '05551112233', birth_date: '12.05.2015', medical_info: 'Fıstık alerjisi var.' },
                            { name: 'Mehmet Demir', display_id: '1002', initials: 'MD', color: 'sky', status: 'Aktif', class_id: targetClassId, parent_name: 'Ahmet Demir', gender: 'Erkek', parent_phone: '05552223344', birth_date: '01.02.2016' },
                            { name: 'Zeynep Kaya', display_id: '1003', initials: 'ZK', color: 'rose', status: 'Devamsız', class_id: targetClassId, parent_name: 'Hüseyin Kaya', gender: 'Kız', parent_phone: '05553334455', medications: 'Günde 1 kez vitamin' },
                            { name: 'Can Yıldız', display_id: '1004', initials: 'CY', color: 'emerald', status: 'Aktif', class_id: targetClassId, parent_name: 'Mustafa Yıldız', gender: 'Erkek', parent_phone: '05554445566' },
                            { name: 'Elif Çelik', display_id: '1005', initials: 'EÇ', color: 'orange', status: 'İzinli', class_id: targetClassId, parent_name: 'Zeliha Çelik', gender: 'Kız', parent_phone: '05555556677' },
                            { name: 'Burak Soylu', display_id: '1006', initials: 'BS', color: 'sky', status: 'Aktif', class_id: targetClassId, parent_name: 'Kemal Soylu', gender: 'Erkek', parent_phone: '05321234567' },
                            { name: 'Selin Ak', display_id: '1007', initials: 'SA', color: 'rose', status: 'Aktif', class_id: targetClassId, parent_name: 'Merve Ak', gender: 'Kız', parent_phone: '05327654321' }
                        ];

                        // Try insert. If schema is updated, this will work perfectly.
                        // If not, our fallback (handled below) will still save basic data.
                        const { error: insertError } = await supabase.from('students').insert(mockStudents);

                        if (insertError) {
                            // Check for schema errors
                            if (insertError.code === '42703' || insertError.code === 'PGRST204') {
                                // Fallback for outdated schema
                                const basicStudents = mockStudents.map(s => ({
                                    name: s.name,
                                    display_id: s.display_id,
                                    initials: s.initials,
                                    color: s.color,
                                    status: s.status,
                                    class_id: s.class_id
                                }));

                                const { error: basicError } = await supabase.from('students').insert(basicStudents);
                                if (basicError) throw basicError;

                                Alert.alert('Uyarı', 'Veritabanında yeni sütunlar (cinsiyet, veli tel vb.) eksik olduğu için sadece temel öğrenci bilgileri yüklendi. Lütfen Supabase\'den sütunları ekleyiniz.');
                            } else {
                                throw insertError;
                            }
                        } else {
                            Alert.alert('Tam Başarı', 'Eski veriler temizlendi ve 7 adet detaylı örnek öğrenci kaydı başarıyla oluşturuldu.');
                        }

                        fetchStudents();

                    } catch (e: any) {
                        console.error(e);
                        Alert.alert('İşlem Başarısız', e.message || 'Veritabanı hatası.');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleEdit = (student: any) => {
        // Navigate to CreateStudent screen in "Edit Mode"
        navigation.navigate('CreateStudent', { studentToEdit: student });
    };

    // Removed old saveEdit/modal logic as we use full screen now
    const saveEdit = async () => { };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.display_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'all' || s.classes?.name === selectedClass;
        return matchesSearch && matchesClass;
    });

    const activeCount = students.filter(s => s.status === 'Aktif').length;
    const absentCount = students.filter(s => s.status === 'Devamsız').length;

    // Elegant colors - Pastel tones for initials
    const getBadgeColors = (colorKey: string) => {
        const bgColors: Record<string, any> = {
            orange: { bg: '#fff7ed', text: '#c2410c' },
            purple: { bg: '#faf5ff', text: '#7e22ce' },
            sky: { bg: '#f0f9ff', text: '#0369a1' },
            rose: { bg: '#fff1f2', text: '#be123c' },
            emerald: { bg: '#ecfdf5', text: '#047857' },
        };
        return bgColors[colorKey] || bgColors.orange;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* ELEGANT HEADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Öğrenci Yönetimi</Text>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* TOP ACTIONS & STATS */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Toplam</Text>
                                <Text style={{ fontSize: 16, fontWeight: '400', color: '#334155' }}>{students.length}</Text>
                            </View>
                            <View style={{ width: 1, height: '100%', backgroundColor: '#e2e8f0' }} />
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Aktif</Text>
                                <Text style={{ fontSize: 16, fontWeight: '400', color: '#10b981' }}>{activeCount}</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setShowKvkk(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} color="#64748b" />
                            <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748b' }}>KVKK Uyumlu</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ACTIONS ROW */}
                    <View style={{ marginBottom: 20, flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateStudent')}
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: '#1e293b',
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
                            <Text style={{ fontSize: 14, fontWeight: '500', color: 'white', letterSpacing: 0.5 }}>YENİ ÖĞRENCİ KAYDI</Text>
                        </TouchableOpacity>

                        {/* DEBUG: MOCK DATA BUTTON - Optional, but keeping functional if user wants */}
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
                                placeholder="İsim, numara veya sınıf ara..."
                                placeholderTextColor="#94a3b8"
                                style={{ flex: 1, marginLeft: 10, fontSize: 13, color: '#334155' }}
                            />
                        </View>

                        {/* CLASS FILTER PILLS */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedClass('all')}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    backgroundColor: selectedClass === 'all' ? '#334155' : 'white',
                                    borderWidth: 1,
                                    borderColor: selectedClass === 'all' ? '#334155' : '#e2e8f0',
                                    marginRight: 8
                                }}
                            >
                                <Text style={{ color: selectedClass === 'all' ? 'white' : '#64748b', fontSize: 12, fontWeight: '500' }}>Tümü</Text>
                            </TouchableOpacity>
                            {classes.map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    onPress={() => setSelectedClass(c.name)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                        backgroundColor: selectedClass === c.name ? '#334155' : 'white',
                                        borderWidth: 1,
                                        borderColor: selectedClass === c.name ? '#334155' : '#e2e8f0',
                                        marginRight: 8
                                    }}
                                >
                                    <Text style={{ color: selectedClass === c.name ? 'white' : '#64748b', fontSize: 12, fontWeight: '500' }}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* LIST */}
                    {loading ? <ActivityIndicator color="#0f172a" style={{ marginTop: 20 }} /> : (
                        <View style={{ gap: 8 }}>
                            {filteredStudents.map(student => {
                                const theme = getBadgeColors(student.color);
                                return (
                                    <View key={student.id} style={{
                                        backgroundColor: 'white',
                                        borderRadius: 12,
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: '#f1f5f9',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}>
                                        {/* AVATAR - SQUARE-ISH */}
                                        <View style={{
                                            width: 44, height: 44, borderRadius: 10,
                                            backgroundColor: theme.bg,
                                            alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden' // Ensure image respects border radius
                                        }}>
                                            {student.image_url ? (
                                                <Image
                                                    source={{ uri: student.image_url }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                                                    {student.initials || '??'}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{student.name}</Text>
                                                {student.status !== 'Aktif' && (
                                                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fef2f2', borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '500' }}>{student.status}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                                                <Text style={{ fontSize: 11, color: '#64748b' }}>{student.classes?.name || '-'}</Text>
                                                {student.teacher_name && (
                                                    <>
                                                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' }} />
                                                        <Text style={{ fontSize: 11, color: '#64748b' }}>{student.teacher_name}</Text>
                                                    </>
                                                )}
                                                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' }} />
                                                <Text style={{ fontSize: 11, color: '#94a3b8' }}>ID: {student.display_id}</Text>
                                            </View>
                                        </View>

                                        {/* ACTIONS */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <TouchableOpacity onPress={() => handleEdit(student)} style={{ padding: 8 }}>
                                                <Edit2 size={16} color="#94a3b8" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(student.id)} style={{ padding: 8 }}>
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
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
                            Bu paneldeki tüm öğrenci verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında şifrelenerek saklanmaktadır. Veriler sadece yetkili personel tarafından eğitim amaçlı görüntülenebilir. Yetkisiz paylaşım yasal sorumluluk doğurur.
                        </Text>
                        <TouchableOpacity onPress={() => setShowKvkk(false)} style={{ backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: '500' }}>Okudum, Onaylıyorum</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* EDIT MODAL */}
            <Modal visible={showEditModal} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Öğrenci Düzenle</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 12, alignItems: 'center', color: '#64748b', marginBottom: 4 }}>Öğrenci Adı</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e293b', marginBottom: 16 }}
                        />

                        <Text style={{ fontSize: 12, alignItems: 'center', color: '#64748b', marginBottom: 4 }}>Durum</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                            {['Aktif', 'Devamsız', 'İzinli'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setEditStatus(status)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        backgroundColor: editStatus === status ? '#0f172a' : '#f8fafc',
                                        borderWidth: 1,
                                        borderColor: editStatus === status ? '#0f172a' : '#e2e8f0'
                                    }}
                                >
                                    <Text style={{ fontSize: 12, color: editStatus === status ? 'white' : '#64748b' }}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={saveEdit} style={{ backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: '500' }}>Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default AdminStudentManagementScreen;
