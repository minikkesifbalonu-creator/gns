import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Plus, Search, Trash2, School, User, GraduationCap, Edit2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

const AdminClassManagementScreen = ({ navigation }: any) => {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editTeacherId, setEditTeacherId] = useState<string | null>(null);
    const [editCapacity, setEditCapacity] = useState(20);

    // Teacher Assignment State (Quick Assign)
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [assigningClassId, setAssigningClassId] = useState<string | null>(null); // If set, we are quick assigning
    const [isEditingSelection, setIsEditingSelection] = useState(false); // If true, we are selecting for Edit Modal
    const [teachers, setTeachers] = useState<any[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchClasses();
            fetchTeachers();
        }, [])
    );

    const fetchClasses = async () => {
        setLoading(true);
        try {
            // Need to fetch student count. 
            // supabase-js doesn't support complex count aggregation easily in one query without a view or rpc usually, 
            // but we can try deep select if relation is set.
            // Alternative: Fetch all students and map them. (Better for small datasets)

            const { data: classesData, error: classError } = await supabase
                .from('classes')
                .select(`
                    id, name, level, teacher_id, capacity,
                    profiles:teacher_id ( name ) 
                `)
                .order('name');

            if (classError) throw classError;

            // Fetch student counts
            const { data: studentsData, error: studentError } = await supabase
                .from('students')
                .select('class_id');

            if (studentError) throw studentError;

            // Map counts
            const counts: { [key: string]: number } = {};
            studentsData?.forEach(s => {
                if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
            });

            const merged = classesData?.map(c => ({
                ...c,
                studentCount: counts[c.id] || 0
            }));

            setClasses(merged || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Sınıflar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, name, branch')
            .eq('role', 'teacher')
            .order('name');
        setTeachers(data || []);
    };

    const handleDelete = async (id: string, name: string) => {
        Alert.alert(
            'Sınıfı Sil',
            `"${name}" sınıfını silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('classes').delete().eq('id', id);
                            if (error) throw error;
                            fetchClasses();
                        } catch (error) {
                            Alert.alert('Hata', 'Silme işlemi başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item: any) => {
        setEditingClass(item);
        setEditName(item.name);
        setEditTeacherId(item.teacher_id);
        setEditCapacity(item.capacity || 20);
        setShowEditModal(true);
    };

    const saveEdit = async () => {
        if (!editingClass) return;
        try {
            const { error } = await supabase
                .from('classes')
                .update({
                    name: editName,
                    teacher_id: editTeacherId,
                    capacity: editCapacity
                })
                .eq('id', editingClass.id);

            if (error) throw error;
            setShowEditModal(false);
            setEditingClass(null);
            fetchClasses();
            Alert.alert('Başarılı', 'Sınıf güncellendi.');
        } catch (error: any) {
            Alert.alert('Hata', 'Güncelleme başarısız: ' + error.message);
        }
    };

    const openTeacherAssignModal = (classId: string, isForEdit = false) => {
        setAssigningClassId(classId);
        setIsEditingSelection(isForEdit);
        setShowTeacherModal(true);
    };

    const assignTeacher = async (teacherId: string) => {
        if (isEditingSelection) {
            setEditTeacherId(teacherId);
            setShowTeacherModal(false);
            return;
        }

        if (!assigningClassId) return;
        try {
            const { error } = await supabase
                .from('classes')
                .update({ teacher_id: teacherId })
                .eq('id', assigningClassId);

            if (error) throw error;

            setShowTeacherModal(false);
            setAssigningClassId(null);
            fetchClasses();
            Alert.alert('Başarılı', 'Sınıf öğretmeni atandı.');
        } catch (error) {
            Alert.alert('Hata', 'Atama yapılırken bir hata oluştu.');
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
        // Deterministic random based on ID
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return cardThemes[Math.abs(hash) % cardThemes.length];
    };

    const renderItem = ({ item }: { item: any }) => {
        const theme = getTheme(item.id);
        const hasTeacher = item.profiles && item.profiles.name;

        // Progress Bar Calculation
        const capacity = item.capacity || 20;
        const studentCount = item.studentCount || 0;
        const progress = Math.min(1, studentCount / capacity);
        // Use theme color for progress bar if not critical
        const progressColor = progress > 0.9 ? '#ef4444' : theme.icon;

        return (
            <View style={{
                backgroundColor: hasTeacher ? theme.bg : '#fff1f2',
                borderRadius: 14,
                marginBottom: 6, // Reduced 8->6
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: hasTeacher ? theme.border : '#fecaca',
                overflow: 'hidden',
                shadowColor: theme.icon,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1
            }}>
                {/* Decorative Background Icon */}
                <View style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.08 }}>
                    <School size={100} color={theme.icon} />
                </View>

                <View style={{ padding: 10, paddingVertical: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.icon }}>{item.name.match(/\d+/) ? item.name.match(/\d+/)[0] : 'C'}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
                                <Text style={{ fontSize: 10, color: theme.text, opacity: 0.7 }}>{hasTeacher ? `ID: ${item.id.slice(0, 4)}...` : 'Öğretmen Yok!'}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ width: 26, height: 26, backgroundColor: 'white', borderRadius: 6, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                <Edit2 size={12} color={theme.icon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ width: 26, height: 26, backgroundColor: 'white', borderRadius: 6, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                <Trash2 size={12} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => !hasTeacher && openTeacherAssignModal(item.id)}
                        activeOpacity={hasTeacher ? 1 : 0.7}
                        style={{ flexDirection: 'row', marginBottom: 6 }}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.5)', padding: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                            <User size={12} color={hasTeacher ? theme.icon : '#ef4444'} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: theme.text, opacity: 0.6, textTransform: 'uppercase' }}>SINIF ÖĞRETMENİ</Text>
                                {hasTeacher ? (
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }} numberOfLines={1}>{item.profiles.name}</Text>
                                ) : (
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#b91c1c' }}>Öğretmen Ata</Text>
                                )}
                            </View>
                            {!hasTeacher && <Plus size={12} color="#b91c1c" />}
                        </View>
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 9, fontWeight: '600', color: theme.text, opacity: 0.7 }}>DOLULUK</Text>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: theme.text }}>{studentCount}/{capacity}</Text>
                        </View>
                        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1.5, overflow: 'hidden' }}>
                            <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: progressColor, borderRadius: 1.5 }} />
                        </View>
                    </View>
                </View>
            </View>
        );
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
                        <Text style={{ fontSize: 22, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Sınıf Yönetimi</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* STATS & QUICK ACTIONS - REFINED BUTTONS */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, padding: 14, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <School size={14} color="#6366f1" />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>TOPLAM SINIF</Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b' }}>{classes.length}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateClass')}
                        style={{ flex: 1, padding: 14, backgroundColor: '#1e293b', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#1e293b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
                    >
                        <Plus size={20} color="white" style={{ marginBottom: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>YENİ SINIF EKLE</Text>
                    </TouchableOpacity>
                </View>

                {/* SEARCH - REFINED HEIGHT */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 44, paddingHorizontal: 14 }}>
                        <Search size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Sınıf adı veya öğretmen ara..."
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
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed' }}>
                                <School size={40} color="#cbd5e1" />
                                <Text style={{ marginTop: 16, color: '#94a3b8', fontSize: 14 }}>Henüz sınıf oluşturulmamış.</Text>
                            </View>
                        }
                    />
                )}
            </ScrollView>

            {/* EDIT MODAL - ENHANCED */}
            <Modal visible={showEditModal} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 }}>Sınıfı Düzenle</Text>

                        <View style={{ gap: 16, marginBottom: 24 }}>
                            {/* Class Name */}
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Sınıf Adı</Text>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b' }}
                                />
                            </View>

                            {/* Teacher */}
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Sınıf Öğretmeni</Text>
                                <TouchableOpacity
                                    onPress={() => openTeacherAssignModal('', true)}
                                    style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <User size={16} color="#64748b" />
                                        <Text style={{ fontSize: 15, color: '#1e293b' }}>
                                            {teachers.find(t => t.id === editTeacherId)?.name || 'Atanmamış'}
                                        </Text>
                                    </View>
                                    <ChevronLeft size={16} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>

                            {/* Capacity */}
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Kapasite</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <TouchableOpacity onPress={() => setEditCapacity(Math.max(1, editCapacity - 1))} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                        <Text style={{ fontSize: 20, color: '#334155' }}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>{editCapacity}</Text>
                                    <TouchableOpacity onPress={() => setEditCapacity(Math.min(50, editCapacity + 1))} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                                        <Text style={{ fontSize: 20, color: '#334155' }}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveEdit} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* TEACHER ASSIGN LIST */}
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
                                onPress={() => assignTeacher(teacher.id)}
                                style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontWeight: '600', color: '#64748b', fontSize: 16 }}>{teacher.name.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }}>{teacher.name}</Text>
                                        <Text style={{ fontSize: 12, color: '#64748b' }}>{teacher.branch || 'Branş Yok'}</Text>
                                    </View>
                                </View>
                                {((isEditingSelection && editTeacherId === teacher.id) || (!isEditingSelection && false)) && (
                                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminClassManagementScreen;
