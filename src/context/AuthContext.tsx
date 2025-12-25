import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = await AsyncStorage.getItem('okul_gunesi_user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error('User loading error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (loginId: string, password: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('login_id', loginId)
                .eq('password', password)
                .maybeSingle();

            if (error || !data) {
                return { error: error || new Error('Hatalı kullanıcı adı veya şifre') };
            }

            const userData = {
                id: data.id,
                loginId: data.login_id,
                name: data.name,
                role: data.role,
                avatar: data.avatar,
                targetId: data.target_id
            };

            setUser(userData);
            await AsyncStorage.setItem('okul_gunesi_user', JSON.stringify(userData));
            return { error: null };
        } catch (err) {
            console.error('Unexpected login error:', err);
            return { error: err };
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('okul_gunesi_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
