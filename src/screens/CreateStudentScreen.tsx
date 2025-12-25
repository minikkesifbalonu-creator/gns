import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X, Users, Save, Calendar, Stethoscope, Pill, Image as ImageIcon, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../supabaseStorage';

const CreateStudentScreen = ({ navigation, route }: any) => {
    // Check if we are in Edit Mode
    const studentToEdit = route.params?.studentToEdit;
    const isEditing = !!studentToEdit;

    // Form States
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState<'Kız' | 'Erkek' | null>(null);
    const [photoUrl, setPhotoUrl] = useState(''); // New field

    // Medical Info
    const [medicalInfo, setMedicalInfo] = useState('');
    const [medications, setMedications] = useState('');

    // Parent Info
    const [parentName, setParentName] = useState('');
    const [parentSurname, setParentSurname] = useState('');
    const [parentPhone, setParentPhone] = useState('');

    // Class Selection
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [showClassModal, setShowClassModal] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    // Populate fields if editing
    useEffect(() => {
        if (studentToEdit) {
            // Split name if possible
            const names = (studentToEdit.name || '').split(' ');
            if (names.length > 1) {
                setSurname(names.pop() || '');
                setName(names.join(' '));
            } else {
                setName(studentToEdit.name || '');
            }

            // Split parent name if possible
            const pNames = (studentToEdit.parent_name || '').split(' ');
            if (pNames.length > 1) {
                setParentSurname(pNames.pop() || '');
                setParentName(pNames.join(' '));
            } else {
                setParentName(studentToEdit.parent_name || '');
            }

            setBirthDate(studentToEdit.birth_date || '');
            setMedicalInfo(studentToEdit.medical_info || '');
            setMedications(studentToEdit.medications || '');
            setParentPhone(studentToEdit.parent_phone || '');
            if (studentToEdit.gender === 'Kız' || studentToEdit.gender === 'Erkek') {
                setGender(studentToEdit.gender);
            }
            setPhotoUrl(studentToEdit.image_url || '');

            // Class will be set after classes are fetched if we match IDs, 
            // but for now we need to wait for classes fetch.
        }
    }, [studentToEdit]);

    // Set selected class once classes are loaded and if editing
    useEffect(() => {
        if (studentToEdit && classes.length > 0 && studentToEdit.classes) {
            // If studentToEdit has class object structure from join
            // Or if it has class_id
            const cId = studentToEdit.class_id || studentToEdit.classes?.id; // Depends on how it was fetched
            // The fetch in AdminStudentManagement fetches `classes (name, teacher_id)`. It doesn't fetch ID inside classes object usually unless requested, 
            // but `class_id` column is on student table. 
            // Let's assume studentToEdit has `classes` object with name, we can find by name or if we have class_id.
            // Actually AdminStudentManagement select query includes `classes(name, teacher_id)`. 
            // It does NOT select `class_id` explicitly in the query I saw earlier? 
            // Wait, I checked line 49 of AdminStudentManagementScreen.tsx in previous turn. 
            // It selects: id, display_id, name, status, initials, color, classes (name, teacher_id).
            // It does NOT select `class_id`. 
            // So we might not have the ID directly. We have the name.
            const className = studentToEdit.classes?.name;
            if (className) {
                const found = classes.find(c => c.name === className);
                if (found) setSelectedClass(found);
            }
        }
    }, [studentToEdit, classes]);


    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name').order('name');
        setClasses(data || []);
    };

    const handleSave = async () => {
        if (!name || !selectedClass || !parentName || !parentSurname || !parentPhone || !gender) {
            Alert.alert('Eksik Bilgi', 'Lütfen öğrenci adı, soyadı, cinsiyet, sınıf ve tüm veli bilgilerini giriniz.');
            return;
        }

        setLoading(true);
        try {
            const fullName = `${name} ${surname}`.trim();
            const parentFullName = `${parentName} ${parentSurname}`.trim();
            const initials = name[0]?.toUpperCase() + (surname[0]?.toUpperCase() || '');

            const studentData: any = {
                name: fullName,
                class_id: selectedClass.id,
                initials: initials,
                birth_date: birthDate || null,
                medical_info: medicalInfo || null,
                medications: medications || null,
                parent_name: parentFullName,
                parent_phone: parentPhone,
                gender: gender,
                image_url: photoUrl || null,
            };

            let error;
            if (isEditing) {
                // Update
                const { error: updateError } = await supabase
                    .from('students')
                    .update(studentData)
                    .eq('id', studentToEdit.id);
                error = updateError;
            } else {
                // Create
                const randomId = Math.floor(1000 + Math.random() * 9000).toString();
                const colors = ['orange', 'purple', 'sky', 'rose', 'emerald'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                studentData.display_id = randomId;
                studentData.color = randomColor;
                studentData.status = 'Aktif';

                const { error: insertError } = await supabase.from('students').insert(studentData);
                error = insertError;
            }

            if (error) {
                console.error("Supabase Error:", error);
                if (error.code === '42703' || error.code === 'PGRST204') {
                    // Fallback: Retry with ONLY basic fields
                    const basicData = {
                        name: studentData.name,
                        class_id: studentData.class_id,
                        display_id: studentData.display_id,
                        initials: studentData.initials,
                        color: studentData.color,
                        status: studentData.status
                        // We exclude parent_name, phone, gender, etc. to ensure success
                    };

                    let retryError;
                    if (isEditing) {
                        const { error: ue } = await supabase.from('students').update(basicData).eq('id', studentToEdit.id);
                        retryError = ue;
                    } else {
                        const { error: ie } = await supabase.from('students').insert(basicData);
                        retryError = ie;
                    }

                    if (retryError) {
                        Alert.alert('Kritik Hata', 'Temel kayıt bile oluşturulamadı: ' + retryError.message);
                        return;
                    }

                    Alert.alert(
                        'Kısmi Başarı',
                        'Kayıt oluşturuldu ancak veritabanı şeması eksik olduğu için (gender, parent_phone vb.) detaylı bilgiler kaydedilemedi.'
                    );
                    navigation.goBack();
                    return; // Return here after success fallback
                } else {
                    throw error;
                }
                return;
            }

            Alert.alert('Başarılı', `Öğrenci kaydı ${isEditing ? 'güncellendi' : 'oluşturuldu'}.`, [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Hata', 'İşlem başarısız: ' + error.message);
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
                <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Yeni Öğrenci Kaydı</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* STUDENT INFO SECTION */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Öğrenci Bilgileri</Text>

                        <View style={{ gap: 16 }}>
                            {/* PHOTO URL & GENDER */}
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>FOTOĞRAF URL (Opsiyonel)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                        <View style={{ paddingLeft: 12 }}>
                                            <ImageIcon size={16} color="#94a3b8" />
                                        </View>
                                        <TextInput
                                            value={photoUrl}
                                            onChangeText={setPhotoUrl}
                                            placeholder="https://..."
                                            placeholderTextColor="#94a3b8"
                                            style={{ flex: 1, padding: 12, fontSize: 14, color: '#1e293b' }}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: 120 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>CİNSİYET</Text>
                                    <View style={{ flexDirection: 'row', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 4 }}>
                                        <TouchableOpacity
                                            onPress={() => setGender('Kız')}
                                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: gender === 'Kız' ? '#fce7f3' : 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: gender === 'Kız' ? '#db2777' : '#94a3b8' }}>Kız</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setGender('Erkek')}
                                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: gender === 'Erkek' ? '#e0f2fe' : 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: gender === 'Erkek' ? '#0284c7' : '#94a3b8' }}>Erkek</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>AD</Text>
                                    <TextInput
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Ali"
                                        placeholderTextColor="#94a3b8"
                                        style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>SOYAD</Text>
                                    <TextInput
                                        value={surname}
                                        onChangeText={setSurname}
                                        placeholder="Yılmaz"
                                        placeholderTextColor="#94a3b8"
                                        style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>SINIF</Text>
                                <TouchableOpacity
                                    onPress={() => setShowClassModal(true)}
                                    style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <Text style={{ fontSize: 15, color: selectedClass ? '#1e293b' : '#94a3b8' }}>
                                        {selectedClass ? selectedClass.name : 'Sınıf Seçiniz'}
                                    </Text>
                                    <Users size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>DOĞUM TARİHİ</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <View style={{ paddingLeft: 14 }}>
                                        <Calendar size={18} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        value={birthDate}
                                        onChangeText={setBirthDate}
                                        placeholder="GG.AA.YYYY (Örn: 12.05.2018)"
                                        placeholderTextColor="#94a3b8"
                                        style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b' }}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* HEALTH INFO SECTION */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Sağlık Bilgileri</Text>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>BİLİNDİK HASTALIK / alerji DURUMU</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <View style={{ paddingLeft: 14, paddingTop: 14 }}>
                                        <Stethoscope size={18} color="#ef4444" />
                                    </View>
                                    <TextInput
                                        value={medicalInfo}
                                        onChangeText={setMedicalInfo}
                                        placeholder="Yoksa boş bırakınız..."
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                        style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b', minHeight: 80, textAlignVertical: 'top' }}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>KULLANILAN İLAÇLAR</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <View style={{ paddingLeft: 14, paddingTop: 14 }}>
                                        <Pill size={18} color="#f59e0b" />
                                    </View>
                                    <TextInput
                                        value={medications}
                                        onChangeText={setMedications}
                                        placeholder="Günde kaç kez, hangi dozda..."
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                        style={{ flex: 1, padding: 14, fontSize: 15, color: '#1e293b', minHeight: 80, textAlignVertical: 'top' }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* PARENT INFO SECTION */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#3b82f6', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Veli Bilgileri</Text>

                        <View style={{ gap: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>VELİ ADI</Text>
                                    <TextInput
                                        value={parentName}
                                        onChangeText={setParentName}
                                        placeholder="Ahmet"
                                        placeholderTextColor="#94a3b8"
                                        style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>VELİ SOYADI</Text>
                                    <TextInput
                                        value={parentSurname}
                                        onChangeText={setParentSurname}
                                        placeholder="Yılmaz"
                                        placeholderTextColor="#94a3b8"
                                        style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' }}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 }}>CEP TELEFONU</Text>
                                <TextInput
                                    value={parentPhone}
                                    onChangeText={setParentPhone}
                                    placeholder="05XX XXX XX XX"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' }}
                                />
                            </View>

                            <Text style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: -8 }}>
                                Not: Bu bilgiler kaydedildikten sonra, 'Hesap & Şifre İşlemleri' menüsünden bu veli adına hesap oluşturup şifre tanımlayabilirsiniz.
                            </Text>
                        </View>
                    </View>

                </ScrollView>

                {/* BOTTOM ACTION */}
                <View style={{ padding: 20, backgroundColor: '#fdfdfd', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        style={{
                            backgroundColor: '#1e293b',
                            paddingVertical: 18,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            shadowColor: '#1e293b',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 4
                        }}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <Save size={20} color="white" />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}>
                                    {isEditing ? 'GÜNCELLE' : 'KAYDET'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* CLASS MODAL */}
            <Modal visible={showClassModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
                    <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a' }}>Sınıf Seç</Text>
                        <TouchableOpacity onPress={() => setShowClassModal(false)}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {classes.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                onPress={() => { setSelectedClass(c); setShowClassModal(false); }}
                                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: selectedClass?.id === c.id ? '#f0f9ff' : 'transparent' }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, color: selectedClass?.id === c.id ? '#0284c7' : '#334155', fontWeight: selectedClass?.id === c.id ? '600' : '400' }}>{c.name}</Text>
                                    {selectedClass?.id === c.id && <CheckCircle2 size={18} color="#0284c7" />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default CreateStudentScreen;
