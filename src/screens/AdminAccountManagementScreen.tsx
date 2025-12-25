import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseStorage';
import { ChevronLeft, Search, Edit2, Share2, Shield, Eye, EyeOff, X, User as UserIcon, Lock, Users, School, Save } from 'lucide-react-native';
import { Share } from 'react-native';

const AdminAccountManagementScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'teacher' | 'parent'>('teacher');
    const [searchQuery, setSearchQuery] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [formName, setFormName] = useState('');
    const [formLoginId, setFormLoginId] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formAvatar, setFormAvatar] = useState('');

    useEffect(() => {
        if (activeTab === 'parent') {
            syncParents();
        } else {
            fetchAccounts();
        }
    }, [activeTab]);

    // Sync parents from Students table to Profiles table
    const syncParents = async () => {
        setLoading(true);
        try {
            // 1. Fetch current parents from profiles
            const { data: existingProfiles, error: pError } = await supabase
                .from('profiles')
                .select('name, login_id')
                .eq('role', 'parent');

            if (pError) throw pError;

            const existingNames = new Set(existingProfiles?.map(p => p.name));

            // 2. Fetch unique parents from students table
            // We use name + phone combination to determine uniqueness ideally, but for now parent_name.
            const { data: students, error: sError } = await supabase
                .from('students')
                .select('parent_name, parent_phone');

            if (sError) throw sError;

            // Simple deduplication by parent name
            const uniqueParents = [];
            const seen = new Set();
            for (const s of students || []) {
                if (s.parent_name && !seen.has(s.parent_name)) {
                    seen.add(s.parent_name);
                    uniqueParents.push(s);
                }
            }

            // 3. Identify new parents
            const newParents = uniqueParents.filter(p => !existingNames.has(p.parent_name));

            // 4. Insert new profiles for them
            if (newParents.length > 0) {
                const newProfiles = newParents.map((p, index) => ({
                    name: p.parent_name,
                    phone: p.parent_phone,
                    role: 'parent',
                    login_id: `V${Date.now().toString().slice(-4)}${index}`, // Generate Veli ID
                    password: '123', // Default Password
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.parent_name)}&background=random`
                }));

                const { error: insertError } = await supabase.from('profiles').insert(newProfiles);
                if (insertError) console.error("Error creating parent profiles:", insertError);
            }

            // 5. Finally fetch all parent accounts
            fetchAccounts();

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`*`) // expanded selection
                .eq('role', activeTab)
                .order('name', { ascending: true });

            if (error) throw error;
            setAccounts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setFormName(account.name);
        setFormLoginId(account.login_id);
        setFormPassword(account.password);
        setFormAvatar(account.avatar_url || account.avatar || '');
        setShowEditModal(true);
        setShowPassword(false);
    };

    const handleUpdate = async () => {
        if (!editingAccount) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formName,
                    login_id: formLoginId,
                    password: formPassword,
                    avatar_url: formAvatar
                })
                .eq('id', editingAccount.id);

            if (error) throw error;

            setShowEditModal(false);
            setEditingAccount(null);
            fetchAccounts();
            Alert.alert('Başarılı', 'Hesap bilgileri güncellendi.');
        } catch (error) {
            Alert.alert('Hata', 'Güncelleme yapılamadı.');
        }
    };

    const handleShare = async (account: any) => {
        const message = `🔐 *Okul Yönetim Sistemi Giriş Bilgileri*\n\nSayın ${account.name},\n\nSisteme giriş yapabilmeniz için kullanıcı bilgileriniz aşağıdadır:\n\n👤 *Kullanıcı Adı:* ${account.login_id}\n🔑 *Şifre:* ${account.password}\n\nLütfen giriş yaptıktan sonra şifrenizi değiştiriniz.`;
        try {
            await Share.share({ message });
        } catch (error) {
            console.error(error);
        }
    };

    const filteredList = accounts.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.login_id && item.login_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helper for random colors
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e'];
    const getColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* HEADER - Sharp & Minimalist */}
            <View style={{ padding: 20, paddingTop: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Hesap & Şifre İşlemleri</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                {/* INFO BOX - Sharp */}
                <View style={{ flexDirection: 'row', gap: 16, padding: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, borderRadius: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <Shield size={20} color="#64748b" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}>Güvenli Hesap Yönetimi</Text>
                        <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20 }}>
                            Öğretmen ve velilerin sisteme giriş yapabilmesi için gerekli kullanıcı adı ve şifreleri buradan yönetebilirsiniz.
                        </Text>
                    </View>
                </View>

                {/* TABS - Sharp & Minimalist */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 20, gap: 16 }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('teacher')}
                        style={{ paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'teacher' ? '#3b82f6' : 'transparent' }}
                    >
                        <Text style={{ fontSize: 15, fontWeight: activeTab === 'teacher' ? '600' : '500', color: activeTab === 'teacher' ? '#3b82f6' : '#94a3b8' }}>Öğretmenler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('parent')}
                        style={{ paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: activeTab === 'parent' ? '#3b82f6' : 'transparent' }}
                    >
                        <Text style={{ fontSize: 15, fontWeight: activeTab === 'parent' ? '600' : '500', color: activeTab === 'parent' ? '#3b82f6' : '#94a3b8' }}>Veliler</Text>
                    </TouchableOpacity>
                </View>

                {/* SEARCH - Sharp */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, height: 46, paddingHorizontal: 12 }}>
                        <Search size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="İsim veya Giriş ID ile ara..."
                            placeholderTextColor="#94a3b8"
                            style={{ flex: 1, fontSize: 14, color: '#1e293b' }}
                        />
                    </View>
                </View>

                {/* LIST */}
                {loading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator color="#3b82f6" />
                        <Text style={{ marginTop: 16, color: '#94a3b8', fontSize: 13 }}>Hesaplar yükleniyor...</Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {filteredList.map(item => {
                            const initial = item.name.charAt(0).toUpperCase();
                            const bgColor = getColor(item.name);
                            const hasAvatar = item.avatar || item.avatar_url;

                            return (
                                <View key={item.id} style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ width: 4, backgroundColor: activeTab === 'parent' ? '#eab308' : '#3b82f6' }} />
                                        <View style={{ flex: 1, padding: 16 }}>
                                            {/* TOP ROW */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                                    {/* AVATAR */}
                                                    <View style={{
                                                        width: 44, height: 44, borderRadius: 10,
                                                        backgroundColor: hasAvatar ? '#f8fafc' : bgColor,
                                                        alignItems: 'center', justifyContent: 'center',
                                                        borderWidth: 1, borderColor: hasAvatar ? '#f1f5f9' : 'transparent',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {hasAvatar ? (
                                                            <Image
                                                                source={{ uri: item.avatar || item.avatar_url }}
                                                                style={{ width: '100%', height: '100%' }}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{initial}</Text>
                                                        )}
                                                    </View>
                                                    <View>
                                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }}>{item.name}</Text>
                                                        <Text style={{ fontSize: 12, color: '#64748b' }}>{activeTab === 'parent' ? 'Veli Hesabı' : 'Öğretmen Hesabı'}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* CREDENTIALS ROW */}
                                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                                <View style={{ flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>GİRİŞ ID</Text>
                                                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#334155', marginTop: 2 }}>{item.login_id}</Text>
                                                </View>
                                                <View style={{ flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8' }}>ŞİFRE</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#334155', marginTop: 2 }}>••••••</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* ACTIONS */}
                                            <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                                <TouchableOpacity
                                                    onPress={() => handleShare(item)}
                                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#eff6ff', borderRadius: 6 }}
                                                >
                                                    <Share2 size={14} color="#3b82f6" />
                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Bilgileri Paylaş</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => handleEdit(item)}
                                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}
                                                >
                                                    <Edit2 size={14} color="#64748b" />
                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Düzenle</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* EDIT MODAL - Sharp */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%' }}>
                        {/* Modal Header */}
                        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b' }}>Hesap Bilgilerini Düzenle</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 4 }}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 24 }}>
                            <View style={{ gap: 24 }}>
                                {/* Form Group */}
                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Ad Soyad</Text>
                                    <TextInput
                                        value={formName}
                                        onChangeText={setFormName}
                                        style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>

                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Giriş ID (Kullanıcı Adı)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                                        <View style={{ paddingLeft: 14 }}>
                                            <UserIcon size={18} color="#94a3b8" />
                                        </View>
                                        <TextInput
                                            value={formLoginId}
                                            onChangeText={setFormLoginId}
                                            style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b', fontWeight: '500' }}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Yeni Şifre</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 }}>
                                        <View style={{ paddingLeft: 14 }}>
                                            <Lock size={18} color="#94a3b8" />
                                        </View>
                                        <TextInput
                                            value={formPassword}
                                            onChangeText={setFormPassword}
                                            secureTextEntry={!showPassword}
                                            style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b', fontWeight: '500' }}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 14 }}>
                                            {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Profil Fotoğrafı (URL)</Text>
                                    <TextInput
                                        value={formAvatar}
                                        onChangeText={setFormAvatar}
                                        placeholder="https://..."
                                        style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Action */}
                        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                            <TouchableOpacity
                                onPress={handleUpdate}
                                style={{ backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                            >
                                <Save size={20} color="white" />
                                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Değişiklikleri Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminAccountManagementScreen;
