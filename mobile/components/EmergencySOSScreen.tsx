import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    Linking,
    Modal,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { ModernHeader } from '@/components/ModernHeader';

// ── Types ────────────────────────────────────────────────────────────────────

type ContactType = 'emergency' | 'doctor';

interface Contact {
    id: string;
    type: ContactType;
    name: string;
    phone: string;
    relation?: string;
    specialty?: string;
    notes?: string;
}

// ── Storage key is per-user ───────────────────────────────────────────────────
const storageKey = (userId: string) => `neuroheal_sos_contacts_${userId}`;

// ── Platform-aware confirm / alert ────────────────────────────────────────────
// On web: use browser confirm() / alert(). On native: use React Native Alert.
function platformConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Delete',
) {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            { text: confirmLabel, style: 'destructive', onPress: onConfirm },
        ]);
    }
}

function platformAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatPhone(raw: string): string {
    return raw.replace(/[^\d+\s\-()]/g, '');
}

function emptyContact(type: ContactType): Omit<Contact, 'id'> {
    return type === 'emergency'
        ? { type, name: '', phone: '', relation: '', notes: '' }
        : { type, name: '', phone: '', specialty: '', notes: '' };
}

// ── ContactCard ───────────────────────────────────────────────────────────────

interface ContactCardProps {
    contact: Contact;
    darkMode: boolean;
    onCall: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function ContactCard({ contact, darkMode, onCall, onEdit, onDelete }: ContactCardProps) {
    const isDoctor = contact.type === 'doctor';
    const accentColor = isDoctor ? '#3b82f6' : '#ef4444';
    const bgColor = isDoctor
        ? (darkMode ? 'rgba(59,130,246,0.08)' : '#eff6ff')
        : (darkMode ? 'rgba(239,68,68,0.08)' : '#fff1f2');
    const borderColor = isDoctor
        ? (darkMode ? '#1d4ed8' : '#bfdbfe')
        : (darkMode ? '#991b1b' : '#fecaca');
    const subtitle = isDoctor
        ? contact.specialty || 'Doctor'
        : contact.relation || 'Emergency Contact';

    return (
        <View style={[styles.contactCard, { backgroundColor: bgColor, borderColor }]}>
            <View style={styles.contactCardLeft}>
                <View style={[styles.contactAvatar, { backgroundColor: accentColor }]}>
                    <Ionicons name={isDoctor ? 'medkit' : 'person'} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.contactName, darkMode ? { color: '#d4e8e0' } : { color: '#1f2937' }]}>
                        {contact.name}
                    </Text>
                    <Text style={[styles.contactSubtitle, { color: accentColor }]}>{subtitle}</Text>
                    <Text style={[styles.contactPhone, darkMode ? { color: '#a8d5c4' } : { color: '#4b5563' }]}>
                        {contact.phone}
                    </Text>
                    {contact.notes ? (
                        <Text style={[styles.contactNotes, darkMode ? { color: '#5a8f7f' } : { color: '#9ca3af' }]}>
                            {contact.notes}
                        </Text>
                    ) : null}
                </View>
            </View>
            <View style={styles.contactActions}>
                <Pressable onPress={onCall} style={[styles.callBtn, { backgroundColor: accentColor }]}>
                    <Ionicons name="call" size={18} color="#fff" />
                </Pressable>
                <Pressable onPress={onEdit} style={styles.iconBtn}>
                    <Ionicons name="pencil" size={16} color={darkMode ? '#a8d5c4' : '#6b7280'} />
                </Pressable>
                <Pressable onPress={onDelete} style={styles.iconBtn}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                </Pressable>
            </View>
        </View>
    );
}

// ── ContactModal ──────────────────────────────────────────────────────────────

interface ContactModalProps {
    visible: boolean;
    type: ContactType;
    initial: Omit<Contact, 'id'> | null;
    darkMode: boolean;
    onSave: (data: Omit<Contact, 'id'>) => void;
    onClose: () => void;
}

function ContactModal({ visible, type, initial, darkMode, onSave, onClose }: ContactModalProps) {
    const [form, setForm] = useState<Omit<Contact, 'id'>>(initial ?? emptyContact(type));
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        setForm(initial ?? emptyContact(type));
        setNameError('');
        setPhoneError('');
    }, [initial, type, visible]);

    const isDoctor = type === 'doctor';

    const handleSave = () => {
        let valid = true;
        if (!form.name.trim()) { setNameError('Name is required'); valid = false; }
        else setNameError('');
        if (!form.phone.trim()) { setPhoneError('Phone number is required'); valid = false; }
        else setPhoneError('');
        if (!valid) return;
        onSave(form);
    };

    const field = (
        label: string,
        key: keyof Omit<Contact, 'id' | 'type'>,
        placeholder: string,
        keyboardType: 'default' | 'phone-pad' = 'default',
        error?: string,
    ) => (
        <View style={styles.fieldGroup} key={key}>
            <Text style={[styles.fieldLabel, darkMode ? { color: '#d4e8e0' } : { color: '#374151' }]}>
                {label}
            </Text>
            <TextInput
                style={[
                    styles.fieldInput,
                    darkMode ? styles.fieldInputDark : styles.fieldInputLight,
                    error ? styles.fieldInputError : {},
                ]}
                placeholder={placeholder}
                placeholderTextColor={darkMode ? '#5a8f7f' : '#9ca3af'}
                keyboardType={keyboardType}
                value={(form as any)[key] ?? ''}
                onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, [key]: key === 'phone' ? formatPhone(v) : v }));
                    if (key === 'name') setNameError('');
                    if (key === 'phone') setPhoneError('');
                }}
            />
            {error ? <Text style={styles.fieldError}>{error}</Text> : null}
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.modalWrap, darkMode ? styles.modalWrapDark : styles.modalWrapLight]}>
                <View style={[styles.modalHeader, darkMode ? styles.modalHeaderDark : styles.modalHeaderLight]}>
                    <View style={styles.modalHeaderLeft}>
                        <View style={[styles.modalHeaderIcon, { backgroundColor: isDoctor ? '#3b82f6' : '#ef4444' }]}>
                            <Ionicons name={isDoctor ? 'medkit' : 'person'} size={18} color="#fff" />
                        </View>
                        <Text style={[styles.modalTitle, darkMode ? { color: '#d4e8e0' } : { color: '#111827' }]}>
                            {initial?.name ? 'Edit' : 'Add'} {isDoctor ? 'Doctor' : 'Emergency Contact'}
                        </Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.modalClose}>
                        <Ionicons name="close" size={22} color={darkMode ? '#a8d5c4' : '#6b7280'} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {field('Full Name *', 'name', isDoctor ? 'Dr. Ahmed Khan' : 'Maria Ahmed', 'default', nameError)}
                    {field('Phone Number *', 'phone', '+92 300 1234567', 'phone-pad', phoneError)}
                    {isDoctor
                        ? field('Specialty', 'specialty', 'Neurologist')
                        : field('Relationship', 'relation', 'Wife, Brother, Friend…')
                    }
                    {field('Notes', 'notes', isDoctor ? 'Clinic hours, address…' : 'Any useful info…')}
                </ScrollView>

                <View style={[styles.modalFooter, darkMode ? styles.modalFooterDark : styles.modalFooterLight]}>
                    <Pressable onPress={onClose} style={styles.cancelBtn}>
                        <Text style={[styles.cancelBtnText, darkMode ? { color: '#a8d5c4' } : { color: '#6b7280' }]}>
                            Cancel
                        </Text>
                    </Pressable>
                    <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: isDoctor ? '#3b82f6' : '#ef4444' }]}>
                        <Text style={styles.saveBtnText}>Save Contact</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

interface EmergencySOSScreenProps {
    navigation: { goBack: () => void };
}

export function EmergencySOSScreen({ navigation }: EmergencySOSScreenProps) {
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const userId = userData?.name ?? 'default';
    const STORAGE_KEY = storageKey(userId);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ContactType>('emergency');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [sosPressing, setSosPressing] = useState(false);

    useEffect(() => {
        setContacts([]);
        setLoading(true);
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) setContacts(JSON.parse(raw));
            } catch (_) {}
            setLoading(false);
        })();
    }, [STORAGE_KEY]);

    const save = async (updated: Contact[]) => {
        setContacts(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const handleSaveContact = async (data: Omit<Contact, 'id'>) => {
        if (editingContact) {
            await save(contacts.map((c) =>
                c.id === editingContact.id ? { ...data, id: editingContact.id } : c
            ));
        } else {
            await save([...contacts, { ...data, id: generateId() }]);
        }
        setModalVisible(false);
        setEditingContact(null);
    };

    const handleDelete = (id: string, name: string) => {
        platformConfirm(
            'Delete Contact',
            `Remove ${name} from your contacts?`,
            async () => { await save(contacts.filter((c) => c.id !== id)); },
        );
    };

    const handleCall = (phone: string, name: string) => {
        const cleaned = phone.replace(/[\s\-()]/g, '');
        Linking.openURL(`tel:${cleaned}`).catch(() => {
            platformAlert('Cannot make call', `Please call ${name} at ${phone} manually.`);
        });
    };

    const handleSOS = () => {
        const emergencyContacts = contacts.filter((c) => c.type === 'emergency');
        if (emergencyContacts.length === 0) {
            platformAlert('No Emergency Contacts', 'Please add at least one emergency contact first.');
            return;
        }
        setSosPressing(true);
        setTimeout(() => setSosPressing(false), 300);
        const primary = emergencyContacts[0];
        Linking.openURL(`tel:${primary.phone.replace(/[\s\-()]/g, '')}`).catch(() => {
            platformAlert('Cannot make call', `Please call ${primary.name} at ${primary.phone} manually.`);
        });
    };

    const emergencyList = contacts.filter((c) => c.type === 'emergency');
    const doctorList = contacts.filter((c) => c.type === 'doctor');
    const displayList = activeTab === 'emergency' ? emergencyList : doctorList;

    if (loading) {
        return (
            <View style={[styles.centered, darkMode ? styles.containerDark : styles.containerLight]}>
                <ActivityIndicator color="#10b981" size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, darkMode ? styles.containerDark : styles.containerLight]}>
            <ModernHeader title="SOS & Contacts" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* SOS Button */}
                <Pressable
                    onPress={handleSOS}
                    style={({ pressed }) => [styles.sosButton, (pressed || sosPressing) && styles.sosButtonPressed]}
                >
                    <View style={styles.sosPulse}>
                        <Ionicons name="alert-circle" size={48} color="#fff" />
                    </View>
                    <Text style={styles.sosLabel}>SOS</Text>
                    <Text style={styles.sosSubLabel}>
                        {emergencyList.length > 0 ? `Calls ${emergencyList[0].name}` : 'Add an emergency contact first'}
                    </Text>
                </Pressable>

                {/* Quick-call chips */}
                {contacts.length > 0 && (
                    <View style={styles.quickCallRow}>
                        <Text style={[styles.sectionLabel, darkMode ? { color: '#a8d5c4' } : { color: '#6b7280' }]}>
                            Quick Call
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {contacts.map((c) => (
                                    <Pressable
                                        key={c.id}
                                        onPress={() => handleCall(c.phone, c.name)}
                                        style={[
                                            styles.quickChip,
                                            {
                                                backgroundColor: c.type === 'doctor'
                                                    ? (darkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff')
                                                    : (darkMode ? 'rgba(239,68,68,0.15)' : '#fff1f2'),
                                                borderColor: c.type === 'doctor'
                                                    ? (darkMode ? '#1d4ed8' : '#bfdbfe')
                                                    : (darkMode ? '#991b1b' : '#fecaca'),
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={c.type === 'doctor' ? 'medkit' : 'person'}
                                            size={14}
                                            color={c.type === 'doctor' ? '#3b82f6' : '#ef4444'}
                                        />
                                        <Text style={[styles.quickChipText, { color: c.type === 'doctor' ? '#3b82f6' : '#ef4444' }]}>
                                            {c.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Contacts section */}
                <View style={styles.contactsSection}>
                    {/* Tab bar */}
                    <View style={[styles.tabBar, darkMode ? styles.tabBarDark : styles.tabBarLight]}>
                        {(['emergency', 'doctor'] as ContactType[]).map((t) => (
                            <Pressable
                                key={t}
                                onPress={() => setActiveTab(t)}
                                style={[styles.tabItem, activeTab === t && (darkMode ? styles.tabItemActiveDark : styles.tabItemActive)]}
                            >
                                <Ionicons
                                    name={t === 'doctor' ? 'medkit' : 'person'}
                                    size={16}
                                    color={activeTab === t ? (t === 'doctor' ? '#3b82f6' : '#ef4444') : (darkMode ? '#5a8f7f' : '#9ca3af')}
                                />
                                <Text style={[
                                    styles.tabItemText,
                                    activeTab === t
                                        ? { color: t === 'doctor' ? '#3b82f6' : '#ef4444', fontWeight: '700' }
                                        : { color: darkMode ? '#5a8f7f' : '#9ca3af' },
                                ]}>
                                    {t === 'doctor' ? 'Doctors' : 'Emergency'}{' '}
                                    <Text style={styles.tabBadge}>
                                        ({t === 'doctor' ? doctorList.length : emergencyList.length})
                                    </Text>
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Add button */}
                    <Pressable
                        onPress={() => { setEditingContact(null); setModalVisible(true); }}
                        style={[
                            styles.addBtn,
                            {
                                backgroundColor: activeTab === 'doctor'
                                    ? (darkMode ? 'rgba(59,130,246,0.12)' : '#eff6ff')
                                    : (darkMode ? 'rgba(239,68,68,0.12)' : '#fff1f2'),
                                borderColor: activeTab === 'doctor'
                                    ? (darkMode ? '#1d4ed8' : '#bfdbfe')
                                    : (darkMode ? '#991b1b' : '#fecaca'),
                            },
                        ]}
                    >
                        <Ionicons name="add-circle" size={20} color={activeTab === 'doctor' ? '#3b82f6' : '#ef4444'} />
                        <Text style={[styles.addBtnText, { color: activeTab === 'doctor' ? '#3b82f6' : '#ef4444' }]}>
                            Add {activeTab === 'doctor' ? 'Doctor' : 'Emergency Contact'}
                        </Text>
                    </Pressable>

                    {/* Contact list */}
                    {displayList.length === 0 ? (
                        <View style={[styles.emptyState, darkMode ? styles.emptyStateDark : styles.emptyStateLight]}>
                            <Ionicons
                                name={activeTab === 'doctor' ? 'medkit-outline' : 'person-add-outline'}
                                size={40}
                                color={darkMode ? '#3a5a4e' : '#d1fae5'}
                            />
                            <Text style={[styles.emptyTitle, darkMode ? { color: '#a8d5c4' } : { color: '#4b5563' }]}>
                                No {activeTab === 'doctor' ? 'doctors' : 'emergency contacts'} yet
                            </Text>
                            <Text style={[styles.emptySubtitle, darkMode ? { color: '#5a8f7f' } : { color: '#9ca3af' }]}>
                                {activeTab === 'emergency'
                                    ? 'Add trusted people who should be called in a migraine emergency'
                                    : 'Add your neurologist or GP for quick access during an episode'}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {displayList.map((c) => (
                                <ContactCard
                                    key={c.id}
                                    contact={c}
                                    darkMode={darkMode}
                                    onCall={() => handleCall(c.phone, c.name)}
                                    onEdit={() => { setEditingContact(c); setActiveTab(c.type); setModalVisible(true); }}
                                    onDelete={() => handleDelete(c.id, c.name)}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimer, darkMode ? styles.disclaimerDark : styles.disclaimerLight]}>
                    <Ionicons name="information-circle-outline" size={16} color={darkMode ? '#5a8f7f' : '#9ca3af'} />
                    <Text style={[styles.disclaimerText, darkMode ? { color: '#5a8f7f' } : { color: '#9ca3af' }]}>
                        For life-threatening emergencies always call your local emergency services (e.g. 115 / 1122 / 112).
                    </Text>
                </View>

            </ScrollView>

            <ContactModal
                visible={modalVisible}
                type={activeTab}
                initial={editingContact ? { ...editingContact } : null}
                darkMode={darkMode}
                onSave={handleSaveContact}
                onClose={() => { setModalVisible(false); setEditingContact(null); }}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    containerLight: { backgroundColor: '#f5f8f7' },
    containerDark: { backgroundColor: '#1a2522' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40, gap: 20 },

    sosButton: {
        backgroundColor: '#dc2626', borderRadius: 24, paddingVertical: 28,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45, shadowRadius: 12, elevation: 10, gap: 4,
    },
    sosButtonPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
    sosPulse: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    sosLabel: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 6 },
    sosSubLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    quickCallRow: { gap: 0 },
    sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    quickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    quickChipText: { fontSize: 13, fontWeight: '600' },

    contactsSection: { gap: 12 },
    tabBar: { flexDirection: 'row', borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
    tabBarLight: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
    tabBarDark: { backgroundColor: '#253029', borderColor: '#3a5a4e' },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    tabItemActive: { backgroundColor: '#f9fafb' },
    tabItemActiveDark: { backgroundColor: '#1a3028' },
    tabItemText: { fontSize: 13 },
    tabBadge: { fontWeight: '500' },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    addBtnText: { fontSize: 14, fontWeight: '600' },

    contactCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    contactAvatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    contactName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    contactSubtitle: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    contactPhone: { fontSize: 13 },
    contactNotes: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
    contactActions: { alignItems: 'center', gap: 8 },
    callBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    iconBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },

    emptyState: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed' },
    emptyStateLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
    emptyStateDark: { backgroundColor: '#1e302a', borderColor: '#2a4a3e' },
    emptyTitle: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

    disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 14, borderWidth: 1 },
    disclaimerLight: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
    disclaimerDark: { backgroundColor: '#1e302a', borderColor: '#2a4a3e' },
    disclaimerText: { fontSize: 12, lineHeight: 17, flex: 1 },

    modalWrap: { flex: 1 },
    modalWrapLight: { backgroundColor: '#f9fafb' },
    modalWrapDark: { backgroundColor: '#1a2522' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalHeaderLight: { backgroundColor: '#fff', borderBottomColor: '#e5e7eb' },
    modalHeaderDark: { backgroundColor: '#253029', borderBottomColor: '#3a5a4e' },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalHeaderIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '700' },
    modalClose: { padding: 4 },
    modalBody: { padding: 20, gap: 16 },
    modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
    modalFooterLight: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
    modalFooterDark: { backgroundColor: '#253029', borderTopColor: '#3a5a4e' },

    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: '600' },
    fieldInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
    fieldInputLight: { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#111827' },
    fieldInputDark: { backgroundColor: '#253029', borderColor: '#3a5a4e', color: '#d4e8e0' },
    fieldInputError: { borderColor: '#ef4444', borderWidth: 2 },
    fieldError: { fontSize: 12, color: '#ef4444', marginTop: 2 },

    cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
    cancelBtnText: { fontSize: 15, fontWeight: '600' },
    saveBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});