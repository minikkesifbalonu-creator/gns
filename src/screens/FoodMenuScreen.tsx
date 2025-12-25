import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../supabaseStorage';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Utensils, Coffee, Sun, Apple, Moon, Leaf, Plus, X, Save, Edit2, CheckCircle2 } from 'lucide-react-native';

const FoodMenuScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [meals, setMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPublished, setIsPublished] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMeals, setEditMeals] = useState<any[]>([]);

    const defaultMeals = [
        { id: 1, type: 'Sabah Kahvaltısı', time: '09:00', icon: 'bakery_dining', color: 'orange', items: [] },
        { id: 2, type: 'Kuşluk Vakti', time: '10:30', icon: 'nutrition', color: 'yellow', items: [] },
        { id: 3, type: 'Öğle Yemeği', time: '12:30', icon: 'restaurant', color: 'green', items: [] },
        { id: 4, type: 'İkindi Kahvaltısı', time: '15:00', icon: 'cookie', color: 'blue', items: [] },
        { id: 5, type: 'Meyve Saati', time: '17:00', icon: 'eco', color: 'rose', items: [] }
    ];

    useEffect(() => {
        fetchMenu(selectedDate);
    }, [selectedDate]);

    const fetchMenu = async (date: string) => {
        try {
            setLoading(true);
            let query = supabase.from('food_menus').select('*').eq('date', date);

            // Admins can see drafts, others only see published
            if (!isAdmin) {
                query = query.eq('is_published', true);
            }

            const { data, error } = await query.maybeSingle();

            if (data && data.meals) {
                setMeals(data.meals);
                setIsPublished(data.is_published);
            } else {
                setMeals([]);
                setIsPublished(false);
            }
        } catch (err) {
            console.error('Error fetching menu:', err);
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    const openEditModal = () => {
        setEditMeals(meals.length > 0 ? JSON.parse(JSON.stringify(meals)) : JSON.parse(JSON.stringify(defaultMeals)));
        setShowEditModal(true);
    };

    const handleAddItem = (mealId: number) => {
        const updated = editMeals.map(m => {
            if (m.id === mealId) {
                return { ...m, items: [...m.items, ''] };
            }
            return m;
        });
        setEditMeals(updated);
    };

    const handleItemChange = (mealId: number, index: number, text: string) => {
        const updated = editMeals.map(m => {
            if (m.id === mealId) {
                const newItems = [...m.items];
                newItems[index] = text;
                return { ...m, items: newItems };
            }
            return m;
        });
        setEditMeals(updated);
    };

    const handleRemoveItem = (mealId: number, index: number) => {
        const updated = editMeals.map(m => {
            if (m.id === mealId) {
                const newItems = m.items.filter((_: any, i: number) => i !== index);
                return { ...m, items: newItems };
            }
            return m;
        });
        setEditMeals(updated);
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase.from('food_menus').upsert({
                date: selectedDate,
                meals: editMeals,
                is_published: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'date' });

            if (error) throw error;

            Alert.alert('Başarılı', 'Menü kaydedildi ve yayınlandı.');
            setShowEditModal(false);
            fetchMenu(selectedDate);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Menü kaydedilemedi.');
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'bakery_dining': return Coffee;
            case 'nutrition': return Leaf;
            case 'restaurant': return Utensils;
            case 'cookie': return Sun;
            case 'eco': return Apple;
            default: return Utensils;
        }
    };

    const colorConfig: Record<string, any> = {
        orange: { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', dot: '#fb923c' },
        yellow: { bg: '#fefce8', text: '#ca8a04', border: '#fef9c3', dot: '#facc15' },
        green: { bg: '#f0fdf4', text: '#16a34a', border: '#dcfce7', dot: '#4ade80' },
        blue: { bg: '#eff6ff', text: '#2563eb', border: '#dbeafe', dot: '#60a5fa' },
        rose: { bg: '#fff1f2', text: '#be123c', border: '#ffe4e6', dot: '#fb7185' },
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
            {/* ELEGANT HEADER */}
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfdfd', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#475569" strokeWidth={1.5} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>Yemek Menüsü</Text>
                </View>
            </View>

            {/* DATE NAVIGATOR - SHARP & DELICATE */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, marginHorizontal: 20, marginVertical: 10, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 }}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={{ padding: 8 }}>
                    <ChevronLeft size={20} color="#64748b" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>{formatDate(selectedDate)}</Text>
                    {isPublished ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <CheckCircle2 size={12} color="#10b981" />
                            <Text style={{ fontSize: 11, fontWeight: '500', color: '#10b981' }}>Yayınlandı</Text>
                        </View>
                    ) : isAdmin ? (
                        <Text style={{ fontSize: 11, fontWeight: '500', color: '#94a3b8', marginTop: 2 }}>Taslak - Yayınlanmadı</Text>
                    ) : null}
                </View>
                <TouchableOpacity onPress={() => changeDate(1)} style={{ padding: 8 }}>
                    <ChevronRight size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#0f172a" size="large" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                        {meals.length > 0 ? (
                            meals.map((meal, index) => {
                                const colors = colorConfig[meal.color] || colorConfig.orange;
                                const IconComponent = getIcon(meal.icon);

                                return (
                                    <View key={index} style={{ marginBottom: 16 }}>
                                        {/* TIMELINE CONNECTOR */}
                                        {index !== meals.length - 1 && (
                                            <View style={{ position: 'absolute', left: 21, top: 40, bottom: -20, width: 2, backgroundColor: '#f1f5f9' }} />
                                        )}

                                        <View style={{ flexDirection: 'row', gap: 16 }}>
                                            {/* ICON */}
                                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                                                <IconComponent size={20} color={colors.text} />
                                            </View>

                                            {/* CARD */}
                                            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
                                                {/* TRANSPARENT ICON WATERMARK */}
                                                <View style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.05, transform: [{ rotate: '-15deg' }] }}>
                                                    <IconComponent size={100} color={colors.text} />
                                                </View>

                                                <View style={{ padding: 16 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }}>{meal.type}</Text>
                                                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#f8fafc', borderRadius: 6 }}>
                                                            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '500' }}>{meal.time}</Text>
                                                        </View>
                                                    </View>

                                                    <View style={{ gap: 6 }}>
                                                        {meal.items.map((item: string, i: number) => (
                                                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                                                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.text }} />
                                                                <Text style={{ fontSize: 13, color: '#334155', fontWeight: '400' }}>{item}</Text>
                                                            </View>
                                                        ))}
                                                        {meal.items.length === 0 && (
                                                            <Text style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic', paddingLeft: 4 }}>Giriş yapılmamış</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'white', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e2e8f0' }}>
                                <Utensils size={32} color="#cbd5e1" strokeWidth={1} />
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#94a3b8', marginTop: 12 }}>Bu tarihte yemek listesi bulunamadı.</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* ADMIN ADD/EDIT BUTTON - FLOATING */}
                    {isAdmin && (
                        <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                            <TouchableOpacity
                                onPress={openEditModal}
                                style={{
                                    backgroundColor: '#1e293b',
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    shadowColor: '#1e293b',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 10,
                                    elevation: 4
                                }}
                            >
                                {meals.length > 0 ? <Edit2 size={18} color="white" /> : <Plus size={18} color="white" />}
                                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                                    {meals.length > 0 ? 'Menüyü Düzenle' : 'Yeni Menü Oluştur'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* EDIT MODAL */}
            <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#fdfdfd' }}>
                    {/* MODAL HEADER */}
                    <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a' }}>Menü Düzenle</Text>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
                                <View style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                                    <Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>Tarih: {formatDate(selectedDate)}</Text>
                                </View>
                            </View>

                            {editMeals.map((meal, mIndex) => {
                                const colors = colorConfig[meal.color] || colorConfig.orange;
                                return (
                                    <View key={meal.id} style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
                                            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                                                {meal.icon === 'bakery_dining' && <Coffee size={16} color={colors.text} />}
                                                {meal.icon === 'nutrition' && <Leaf size={16} color={colors.text} />}
                                                {meal.icon === 'restaurant' && <Utensils size={16} color={colors.text} />}
                                                {meal.icon === 'cookie' && <Sun size={16} color={colors.text} />}
                                                {meal.icon === 'eco' && <Apple size={16} color={colors.text} />}
                                            </View>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{meal.type}</Text>
                                        </View>

                                        <View style={{ gap: 8 }}>
                                            {meal.items.map((item: string, i: number) => (
                                                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                                                    <TextInput
                                                        value={item}
                                                        onChangeText={(text) => handleItemChange(meal.id, i, text)}
                                                        placeholder="Yemek adı giriniz"
                                                        placeholderTextColor="#94a3b8"
                                                        style={{ flex: 1, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 13, color: '#1e293b' }}
                                                    />
                                                    <TouchableOpacity onPress={() => handleRemoveItem(meal.id, i)} style={{ width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' }}>
                                                        <X size={18} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            <TouchableOpacity onPress={() => handleAddItem(meal.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', marginTop: 4, backgroundColor: '#f8fafc' }}>
                                                <Plus size={14} color="#64748b" />
                                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b', marginLeft: 6 }}>Ürün Ekle</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <View style={{ padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                            <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#1e293b', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
                                <Save size={18} color="white" />
                                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>KAYDET VE YAYINLA</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default FoodMenuScreen;
