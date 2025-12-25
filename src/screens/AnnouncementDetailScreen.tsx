import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, User, Tag, Clock, Calendar, AlertCircle } from 'lucide-react-native';

const AnnouncementDetailScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const [announcement, setAnnouncement] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncement();
    }, [id]);

    const fetchAnnouncement = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*, profiles(name), classes(name)')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            if (data) setAnnouncement(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#6366f1" size="large" />
            </View>
        );
    }

    if (!announcement) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#94a3b8' }}>Duyuru bulunamadı.</Text>
            </View>
        );
    }

    // Determine Badge Style and Text (Same logic as Admin List)
    let badgeText = 'TÜM VELİLER';
    let badgeBg = '#f3e8ff'; // violet-100
    let badgeColor = '#7c3aed'; // violet-600
    let categoryLabel = 'Genel Duyuru';

    if (announcement.type === 'Acil' || announcement.type === 'ACİL' || announcement.type === 'Urgent' || announcement.type === 'urgent') {
        badgeText = 'ACİL BİLDİRİM';
        badgeBg = '#ffe4e6'; // rose-100
        badgeColor = '#e11d48'; // rose-600
        categoryLabel = 'Acil Bildirim';
    } else if (announcement.classes?.name) {
        badgeText = `${announcement.classes.name}`;
        badgeBg = '#e0f2fe'; // sky-100
        badgeColor = '#0284c7'; // sky-600
        categoryLabel = 'Sınıf Duyurusu';
    } else if (announcement.type === 'Sınıf') {
        badgeText = 'SINIF DUYURUSU';
        badgeBg = '#e0f2fe';
        badgeColor = '#0284c7';
        categoryLabel = 'Sınıf Duyurusu';
    }

    // Status logic
    const isPublished = announcement.status === 'Yayınlandı';
    const statusText = isPublished ? 'Yayında' : 'Onay Bekliyor';
    const statusColor = isPublished ? '#10b981' : '#f59e0b';
    const statusBg = isPublished ? '#ecfdf5' : '#fffbeb';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* HEADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={{ marginLeft: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 }}>DETAY</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Duyuru İçeriği</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {/* META INFO */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: badgeBg }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: badgeColor, textTransform: 'uppercase' }}>
                                {badgeText}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>
                            {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('tr-TR') : ''}
                        </Text>
                    </View>
                </View>

                {/* TITLE */}
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, lineHeight: 32 }}>
                    {announcement.title}
                </Text>

                {/* AUTHOR INFO */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color="#64748b" />
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                            {announcement.profiles?.name || 'Sistem Yöneticisi'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                            {announcement.profiles?.role === 'teacher' ? 'Öğretmen' : 'Okul Yönetimi'}
                        </Text>
                    </View>
                </View>

                {/* CONTENT */}
                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 16, color: '#334155', lineHeight: 24 }}>
                        {announcement.content}
                    </Text>
                </View>

                {/* IMAGE */}
                {announcement.image_url && (
                    <Image
                        source={{ uri: announcement.image_url }}
                        style={{ width: '100%', height: 250, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' }}
                        resizeMode="cover"
                    />
                )}

                {/* INFO CARDS */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 40 }}>
                    <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <Tag size={20} color={badgeColor} />
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: badgeColor, marginTop: 8, textTransform: 'uppercase' }}>KATEGORİ</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginTop: 4, textAlign: 'center' }}>{categoryLabel}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <AlertCircle size={20} color={statusColor} />
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor, marginTop: 8, textTransform: 'uppercase' }}>DURUM</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginTop: 4 }}>{statusText}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default AnnouncementDetailScreen;
