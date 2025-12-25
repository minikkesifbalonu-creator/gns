import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { supabase } from '../supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronsUpDown, Send, Megaphone, School, Image as ImageIcon, Upload, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CreateAnnouncementScreen = ({ navigation, route }: any) => {
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';
    const initialType = isTeacher ? 'class' : (route.params?.type || 'general');
    const [typeState, setTypeState] = useState(initialType);

    const isClass = typeState === 'class';
    const themeColor = isClass ? '#0284c7' : '#7c3aed'; // Sky vs Purple
    const themeBg = isClass ? '#e0f2fe' : '#f3e8ff';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [showClassPicker, setShowClassPicker] = useState(false);

    useEffect(() => {
        if (isTeacher) {
            setTypeState('class');
            fetchClasses();
        } else if (isClass) {
            fetchClasses();
        }
    }, [isClass, isTeacher]);

    const fetchClasses = async () => {
        try {
            let query = supabase.from('classes').select('id, name, level');

            if (user?.role === 'teacher') {
                query = query.eq('teacher_id', user.id);
            } else {
                query = query.order('level', { ascending: true });
            }

            const { data, error } = await query;
            if (error) throw error;

            setClasses(data || []);
            if (data && data.length > 0) {
                setSelectedClass(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen başlık ve içerik alanlarını doldurunuz.');
            return;
        }

        if (isClass && !selectedClass) {
            Alert.alert('Eksik Bilgi', 'Lütfen bir sınıf seçiniz.');
            return;
        }

        try {
            setLoading(true);

            const announcementData = {
                type: isClass ? 'Sınıf' : 'Genel',
                target_audience: isClass ? 'parents' : 'all',
                target_class_id: isClass ? selectedClass : null,
                title: title,
                content: content,
                status: 'Onay Bekliyor', // Always pending initially as per web parity
                status_text: 'Onay Bekliyor',
                icon: isClass ? 'school' : 'campaign', // Keep string 'campaign' for DB but use Megaphone for UI
                color: isClass ? 'sky' : 'purple',
                author_id: user?.id,
                publish_time: null,
                image_url: imageUrl || null
            };

            const { error } = await supabase.from('announcements').insert(announcementData);

            if (error) throw error;

            Alert.alert('Başarılı', 'Duyuru oluşturuldu! Yönetici onayından sonra yayınlanacaktır.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Duyuru oluşturulurken bir hata meydana geldi.');
        } finally {
            setLoading(false);
        }
    };

    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || 'Sınıf Seçiniz';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* ELEGANT HEADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>
                        {isClass ? 'Yeni Sınıf Mesajı' : 'Genel Duyuru Oluştur'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                    {/* TYPE SELECTOR (ONLY FOR ADMINS) */}
                    {!isTeacher && (
                        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => setTypeState('general')} style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: !isClass ? 'white' : 'transparent', alignItems: 'center', shadowColor: !isClass ? '#000' : 'transparent', shadowOpacity: !isClass ? 0.05 : 0 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: !isClass ? '#0f172a' : '#64748b' }}>Genel Duyuru</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setTypeState('class')} style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: isClass ? 'white' : 'transparent', alignItems: 'center', shadowColor: isClass ? '#000' : 'transparent', shadowOpacity: isClass ? 0.05 : 0 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: isClass ? '#0f172a' : '#64748b' }}>Sınıf Mesajı</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* CONTEXT CARD - COMPACT */}
                    <View style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: themeBg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: isClass ? '#bae6fd' : '#e9d5ff',

                    }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
                            {isClass ? <School size={18} color={themeColor} /> : <Megaphone size={18} color={themeColor} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: themeColor, marginBottom: 2 }}>
                                {isClass ? 'Sınıfa Özel Mesaj' : 'Tüm Okula Duyuru'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#64748b', lineHeight: 16 }}>
                                {isClass ? 'Sadece seçilen sınıfın velileri görebilir.' : 'Tüm okul velilerine bildirim gönderilir.'}
                            </Text>
                        </View>
                    </View>

                    {/* FORM */}
                    <View style={{ gap: 20 }}>
                        {/* CLASS SELECTOR */}
                        {isClass && (
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>HEDEF SINIF</Text>
                                <TouchableOpacity
                                    onPress={() => setShowClassPicker(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}
                                >
                                    <Text style={{ fontSize: 15, color: selectedClass ? '#1e293b' : '#94a3b8' }}>{selectedClassName}</Text>
                                    <ChevronsUpDown size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>BAŞLIK</Text>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder={isClass ? "Örn: 1-A Sınıfı Gezi Duyurusu" : "Örn: 23 Nisan Kutlamaları"}
                                placeholderTextColor="#94a3b8"
                                style={{ padding: 14, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b' }}
                            />
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

                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>İÇERİK</Text>
                            <TextInput
                                value={content}
                                onChangeText={setContent}
                                placeholder="Duyuru detaylarını buraya yazınız..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={6}
                                style={{ padding: 14, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b', minHeight: 120, textAlignVertical: 'top' }}
                            />
                        </View>

                        {/* FILE UPLOAD PLACEHOLDER */}
                        {!isClass && (
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>DOSYA EKLE</Text>
                                <TouchableOpacity style={{ height: 60, borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', flexDirection: 'row', gap: 8 }}>
                                    <Upload size={18} color="#94a3b8" />
                                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748b' }}>Doküman Yükle</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* BOTTOM BUTTON - SHARP & ELEGANT */}
                <View style={{ padding: 20, backgroundColor: '#fdfdfd', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        style={{
                            backgroundColor: '#1e293b',
                            borderRadius: 12,
                            paddingVertical: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            opacity: loading ? 0.8 : 1,
                            shadowColor: '#1e293b',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 2
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Send size={18} color="white" strokeWidth={2} />
                                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 }}>
                                    {isClass ? 'SINIF MESAJINI GÖNDER' : 'DUYURUYU YAYINLA'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* CLASS SELECT MODAL */}
            <Modal visible={showClassPicker} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ width: '100%', height: '60%', backgroundColor: 'white', borderRadius: 16, padding: 0, overflow: 'hidden' }}>
                        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Sınıf Seçiniz</Text>
                            <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            {classes.map((cls) => (
                                <TouchableOpacity
                                    key={cls.id}
                                    onPress={() => { setSelectedClass(cls.id); setShowClassPicker(false); }}
                                    style={{
                                        padding: 16,
                                        borderRadius: 10,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: selectedClass === cls.id ? '#0ea5e9' : '#f1f5f9',
                                        backgroundColor: selectedClass === cls.id ? '#f0f9ff' : 'white'
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: selectedClass === cls.id ? '#0284c7' : '#1e293b' }}>{cls.name}</Text>
                                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{cls.level}. Sınıf</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default CreateAnnouncementScreen;
