import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Trash2, Megaphone, CheckCircle, Bell, Utensils, Star, Info } from 'lucide-react-native';

const AnnouncementsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (user) fetchAnnouncements();
        }, [user, activeTab])
    );

    const getTypeConfig = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('acil')) return { label: 'ACİL DURUM', color: '#e11d48', bg: '#fff1f2', icon: Bell };
        if (t.includes('yemek')) return { label: 'YEMEK LİSTESİ', color: '#d97706', bg: '#fffbeb', icon: Utensils };
        if (t.includes('etkinlik')) return { label: 'ETKİNLİK', color: '#7c3aed', bg: '#f5f3ff', icon: Star };
        if (t.includes('duyuru')) return { label: 'GENEL DUYURU', color: '#2563eb', bg: '#eff6ff', icon: Megaphone };
        return { label: 'BİLGİLENDİRME', color: '#4d7c0f', bg: '#f7fee7', icon: Info };
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data: userReads } = await supabase.from('announcement_reads').select('*').eq('user_id', user.id);
            const readsMap = userReads || [];

            let query = supabase.from('announcements').select('*, classes(name)').eq('status', 'Yayınlandı');

            if (user.role === 'teacher') {
                const { data: cData } = await supabase.from('classes').select('id').eq('teacher_id', user.id).maybeSingle();
                const classId = cData?.id;
                let orPart = `target_audience.eq.all`;
                if (classId) orPart += `,target_class_id.eq.${classId}`;
                query = query.or(orPart);
            } else {
                const { data: sData } = await supabase.from('students').select('class_id').eq('parent_id', user.id).maybeSingle();
                const cId = sData?.class_id;
                if (cId) query = query.or(`target_audience.eq.all,target_class_id.eq.${cId}`);
                else query = query.eq('target_audience', 'all');
            }

            const { data: msgs, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            const filtered = (msgs || []).filter(msg => {
                const record = readsMap.find(r => r.announcement_id === msg.id);
                if (record?.is_deleted) return false;
                const isRead = !!record?.read_at;
                return activeTab === 'unread' ? !isRead : isRead;
            });
            setAnnouncements(filtered);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAction = async (announcementId: string, type: 'read' | 'delete', openDetail = false) => {
        if (!user?.id) return;
        try {
            const updateObj = {
                user_id: user.id,
                announcement_id: announcementId,
                read_at: new Date().toISOString(),
                is_deleted: type === 'delete'
            };

            // Upsert kullanıyoruz: Varsa güncelle, yoksa o kullanıcı ve o mesaj için yeni bir "özel durum" oluştur
            const { error } = await supabase.from('announcement_reads').upsert(updateObj, { onConflict: 'user_id,announcement_id' });

            if (error) throw error;

            if (openDetail && type === 'read') {
                navigation.navigate('AnnouncementDetail', { id: announcementId });
            } else {
                fetchAnnouncements();
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'İşlem kaydedilemedi. Lütfen SQL kısıtlamalarını kontrol edin.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* HEADER - TAM KESKİN */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color="#0f172a" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: '#0f172a' }}>
                    <TouchableOpacity onPress={() => setActiveTab('unread')} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: activeTab === 'unread' ? '#0f172a' : 'white' }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'unread' ? 'white' : '#64748b' }}>YENİ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('read')} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: activeTab === 'read' ? '#0f172a' : 'white', borderLeftWidth: 1, borderLeftColor: '#0f172a' }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: activeTab === 'read' ? 'white' : '#64748b' }}>OKUNMUŞ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {loading ? <ActivityIndicator color="#0f172a" style={{ marginTop: 20 }} /> : (
                    <View style={{ gap: 12 }}>
                        {announcements.length === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.2 }}>
                                <Megaphone size={60} color="#0f172a" />
                                <Text style={{ marginTop: 16, fontWeight: '900', letterSpacing: 1 }}>MESAJ BULUNAMADI</Text>
                            </View>
                        ) : (
                            announcements.map((item) => {
                                const config = getTypeConfig(item.type);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => handleAction(item.id, 'read', true)}
                                        activeOpacity={0.9}
                                        style={{ backgroundColor: 'white', padding: 16, borderWidth: 1, borderColor: '#0f172a', borderLeftWidth: 6, borderLeftColor: config.color, borderRadius: 0, opacity: activeTab === 'read' ? 0.7 : 1 }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <View style={{ backgroundColor: config.bg, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <config.icon size={12} color={config.color} />
                                                <Text style={{ fontSize: 10, fontWeight: '900', color: config.color }}>{config.label}</Text>
                                            </View>
                                            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                                        </View>

                                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', marginBottom: 6 }}>{item.title}</Text>
                                        <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }} numberOfLines={2}>{item.content}</Text>

                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
                                            <TouchableOpacity onPress={() => handleAction(item.id, 'delete')} style={{ paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Trash2 size={14} color="#ef4444" />
                                                <Text style={{ fontSize: 11, fontWeight: '900', color: '#ef4444' }}>SİL</Text>
                                            </TouchableOpacity>
                                            {activeTab === 'unread' && (
                                                <TouchableOpacity onPress={() => handleAction(item.id, 'read')} style={{ paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <CheckCircle size={14} color="white" />
                                                    <Text style={{ fontSize: 11, fontWeight: '900', color: 'white' }}>OKUNDU</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AnnouncementsScreen;