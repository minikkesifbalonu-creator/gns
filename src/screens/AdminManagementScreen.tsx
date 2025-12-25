import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Search, Plus, User, School, Trash2 } from 'lucide-react-native';

const AdminManagementScreen = ({ route, navigation }: any) => {
    const { type } = route.params; // 'students', 'teachers', 'classes'
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const config = {
        students: { title: 'Öğrenci Yönetimi', table: 'students', icon: User },
        teachers: { title: 'Öğretmen Yönetimi', table: 'profiles', filter: { role: 'teacher' }, icon: User },
        classes: { title: 'Sınıf Yönetimi', table: 'classes', icon: School }
    }[type as 'students' | 'teachers' | 'classes'];

    useEffect(() => {
        fetchData();
    }, [type]);

    const fetchData = async () => {
        try {
            setLoading(true);
            let query = supabase.from(config.table).select('*');
            if (config.filter) {
                Object.entries(config.filter).forEach(([k, v]) => {
                    query = query.eq(k, v);
                });
            }
            const { data: res } = await query.order('name');
            setData(res || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>{item.initials || '??'}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b' }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.display_id || 'ID Belirtilmedi'}</Text>
                </View>
            </View>
            <TouchableOpacity style={{ padding: 8 }}>
                <Trash2 size={18} color="#f43f5e" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={24} color="#64748b" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>{config.title}</Text>
                <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>Kayıt bulunamadı.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

export default AdminManagementScreen;
