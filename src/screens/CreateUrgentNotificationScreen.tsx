import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, AlertCircle, Send, CheckSquare, Image as ImageIcon, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CreateUrgentNotificationScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen başlık ve mesaj alanlarını doldurunuz.');
            return;
        }

        if (!confirmed) {
            Alert.alert('Onay Gerekli', 'Lütfen onay kutucuğunu işaretleyiniz.');
            return;
        }

        if (content.length > 160) {
            Alert.alert('Hata', 'Mesaj 160 karakterden uzun olamaz.');
            return;
        }

        try {
            setLoading(true);

            const announcementData = {
                type: 'Acil', // Uppercase A as per existing logic
                target_audience: 'all',
                title: title,
                content: content,
                status: 'Yayınlandı', // Immediate publish
                status_text: 'Yayınlandı',
                icon: 'notification_important',
                color: 'rose',
                author_id: user?.id,
                publish_time: new Date().toISOString(),
                image_url: imageUrl || null
            };

            const { error } = await supabase.from('announcements').insert(announcementData);

            if (error) throw error;

            Alert.alert('Başarılı', 'Acil bildirim başarıyla gönderildi!', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Bildirim gönderilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* ELEGANT HEADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>
                        Acil Durum Bildirimi
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                    {/* WARNING CARD - COMPACT */}
                    <View style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: '#fff1f2',
                        flexDirection: 'row',
                        gap: 12,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: '#fecdd3'
                    }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={18} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#be123c', marginBottom: 2 }}>
                                ÖNEMLİ UYARI
                            </Text>
                            <Text style={{ fontSize: 11, color: '#9f1239', lineHeight: 16 }}>
                                Bu bildirim, tüm velilere ve öğretmenlere sesli uyarı ile anında iletilir. Lütfen sadece gerçek acil durumlarda kullanınız.
                            </Text>
                        </View>
                    </View>

                    {/* FORM */}
                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>ACİL DURUM BAŞLIĞI</Text>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Örn: OKUL TATİL BİLGİSİ"
                                placeholderTextColor="#94a3b8"
                                style={{ padding: 14, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b' }}
                            />
                        </View>

                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>KISA MESAJ (SMS & PUSH)</Text>
                            <TextInput
                                value={content}
                                onChangeText={setContent}
                                placeholder="Mesajınızı buraya giriniz..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={4}
                                maxLength={160}
                                style={{ padding: 14, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b', minHeight: 100, textAlignVertical: 'top' }}
                            />
                            <View style={{ alignItems: 'flex-end', marginTop: 4, paddingRight: 4 }}>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: content.length > 160 ? '#ef4444' : '#94a3b8' }}>{content.length}/160</Text>
                            </View>
                        </View>

                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>RESİM URL (OPSİYONEL)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                <View style={{ paddingLeft: 14 }}>
                                    <ImageIcon size={18} color="#94a3b8" />
                                </View>
                                <TextInput
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                    placeholder="https://..."
                                    placeholderTextColor="#94a3b8"
                                    style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b' }}
                                />
                            </View>
                        </View>

                        {/* CONFIRMATION CHECKBOX - REFINED */}
                        <TouchableOpacity
                            onPress={() => setConfirmed(!confirmed)}
                            style={{
                                padding: 16,
                                backgroundColor: confirmed ? '#fef2f2' : 'white',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: confirmed ? '#fecdd3' : '#f1f5f9',
                                flexDirection: 'row',
                                gap: 12,
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: confirmed ? '#f43f5e' : '#cbd5e1', backgroundColor: confirmed ? '#f43f5e' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                {confirmed && <Check size={14} color="white" strokeWidth={3} />}
                            </View>
                            <Text style={{ flex: 1, fontSize: 12, color: '#334155', fontWeight: '500', lineHeight: 18 }}>
                                Bu bildirimin <Text style={{ fontWeight: '700', color: '#e11d48' }}>tüm kullanıcılara</Text> yüksek öncelikli acil koduyla gönderileceğini onaylıyorum.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* BOTTOM BUTTON - SHARP & ELEGANT */}
                <View style={{ padding: 20, backgroundColor: '#fdfdfd', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading || !confirmed}
                        style={{
                            backgroundColor: '#e11d48',
                            borderRadius: 12,
                            paddingVertical: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            opacity: (loading || !confirmed) ? 0.5 : 1,
                            shadowColor: '#e11d48',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                            elevation: 4
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Send size={18} color="white" />
                                <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold' }}>
                                    ACİL BİLDİRİMİ GÖNDER
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreateUrgentNotificationScreen;
