import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Pill, Clock, Check, StickyNote } from 'lucide-react-native';

const MedicationTrackingScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [medications, setMedications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchMedications();
    }, [user]);

    const fetchMedications = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // 1. Get Teacher's Class
            const { data: classData } = await supabase.from('classes').select('id').eq('teacher_id', user.id).maybeSingle();

            if (classData) {
                // 2. Fetch medications for students in this class
                const { data, error } = await supabase
                    .from('medications')
                    .select(`
                        *,
                        students!inner (name, class_id, initials, color)
                    `)
                    .eq('students.class_id', classData.id)
                    .gte('created_at', today) // Filter for today (or created today)
                    .order('time_of_day', { ascending: true }); // Assuming 'time_of_day' or similar field exists. 
                // Note: Web version uses 'created_at' filter. 
                // Let's assume 'timing' is the text field for time.

                if (error) throw error;
                setMedications(data || []);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'İlaç listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const markAsGiven = async (id: string, currentStatus: string) => {
        if (currentStatus === 'given') return;

        try {
            const { error } = await supabase
                .from('medications')
                .update({
                    status: 'given',
                    given_at: new Date().toISOString(),
                    given_by: user?.id
                })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setMedications(prev => prev.map(m => m.id === id ? { ...m, status: 'given', given_at: new Date().toISOString() } : m));
            Alert.alert('Başarılı', 'İlaç verildi olarak işaretlendi.');
        } catch (err) {
            console.error('Error updating medication:', err);
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: 'white' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={24} color="#64748b" />
                </TouchableOpacity>
                <Text style={{ marginLeft: 16, fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>İlaç Takibi</Text>
            </View>

            <View style={{ padding: 20, paddingBottom: 0 }}>
                <View style={{ backgroundColor: '#fff1f2', padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#fecdd3' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }}>
                        <Pill size={20} color="#f43f5e" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: '#be123c', marginBottom: 4 }}>Önemli Hatırlatma</Text>
                        <Text style={{ fontSize: 12, color: '#9f1239', lineHeight: 16 }}>İlaçları vermeden önce kutu üzerindeki ismi ve dozajı mutlaka veli notu ile karşılaştırınız.</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#f43f5e" size="large" />
                </View>
            ) : medications.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <Pill size={64} color="#e2e8f0" />
                    <Text style={{ color: '#94a3b8', marginTop: 16, textAlign: 'center', fontWeight: 'bold' }}>Bugün için ilaç bildirimi yok.</Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
                    {medications.map((med) => (
                        <View key={med.id} style={{ backgroundColor: 'white', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 16, opacity: med.status === 'given' ? 0.8 : 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: med.students.color ? `${med.students.color}10` : '#fff7ed', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: med.students.color || '#f97316' }}>{med.students.initials}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ color: '#1e293b', fontWeight: 'bold', fontSize: 16 }}>{med.students.name}</Text>
                                        <Text style={{ fontSize: 13, color: '#64748b' }}>{med.medication_name}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                        <Clock size={12} color="#64748b" style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>{med.timing || 'Belirtilmedi'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <StickyNote size={14} color="#64748b" style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b' }}>VELİ NOTU</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: '#334155', fontStyle: 'italic' }}>"{med.parent_note || 'Not yok.'}"</Text>
                            </View>

                            {med.status === 'given' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#ecfdf5', borderRadius: 12, borderWidth: 1, borderColor: '#dcfce7' }}>
                                    <Check size={16} color="#16a34a" style={{ marginRight: 6 }} />
                                    <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 13 }}>Verildi: {new Date(med.given_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => markAsGiven(med.id, med.status)}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#2563eb', borderRadius: 14, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                                >
                                    <Check size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>İlacı Verdim</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default MedicationTrackingScreen;
