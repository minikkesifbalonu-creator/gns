import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Rocket, Fingerprint, AtSign, Sun, Star } from 'lucide-react-native';

const LoginScreen = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!loginId || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        const { error: loginError } = await login(loginId, password);
        if (loginError) {
            setError('ID veya Şifre hatalı.');
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}>
                        <View style={{ alignItems: 'center', marginBottom: 40 }}>
                            <View style={{ position: 'relative', marginBottom: 24 }}>
                                <LinearGradient colors={['#3b82f6', '#10b981']} style={{ width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                                    <Sun size={52} color="white" />
                                </LinearGradient>
                                <View style={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, backgroundColor: '#fbbf24', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white' }}>
                                    <Star size={14} color="#1e293b" fill="#1e293b" />
                                </View>
                            </View>
                            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' }}>
                                Özel Kalkan <Text style={{ color: '#3b82f6' }}>Güneşi Anaokulu</Text>
                            </Text>
                        </View>

                        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' }}>
                            {error ? <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text> : null}

                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 }}>GİRİŞ KİMLİĞİ</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 }}>
                                <AtSign size={20} color="#94a3b8" />
                                <TextInput value={loginId} onChangeText={setLoginId} placeholder="ID..." style={{ flex: 1, height: 56, paddingLeft: 12, color: '#1e293b' }} />
                            </View>

                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 }}>ŞİFRE</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24 }}>
                                <Fingerprint size={20} color="#94a3b8" />
                                <TextInput value={password} onChangeText={setPassword} placeholder="••••" secureTextEntry style={{ flex: 1, height: 56, paddingLeft: 12, color: '#1e293b' }} />
                            </View>

                            <TouchableOpacity onPress={handleLogin} disabled={isSubmitting} style={{ borderRadius: 16, overflow: 'hidden' }}>
                                <LinearGradient colors={['#3b82f6', '#10b981']} style={{ paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                                    {isSubmitting ? <ActivityIndicator color="white" /> : <><Rocket size={20} color="white" style={{ marginRight: 8 }} /><Text style={{ color: 'white', fontWeight: 'bold' }}>BAĞLAN</Text></>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
