/**
 * Alert Rules Screen
 *
 * Allows coaches to create and manage custom alert rules
 * for proactive athlete monitoring.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import {
  getAlertRules,
  createAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  formatTriggerLabel,
  getTriggerIcon,
  AlertRule,
  TRIGGER_TYPES,
  THEME_OPTIONS,
} from '../../lib/services/alert-rules';

export default function AlertRulesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTriggerType, setFormTriggerType] = useState('READINESS_DROP');
  const [formThreshold, setFormThreshold] = useState('');
  const [formThresholdString, setFormThresholdString] = useState('');
  const [formTimeWindow, setFormTimeWindow] = useState('7');
  const [formMinOccurrences, setFormMinOccurrences] = useState('3');
  const [formChannels, setFormChannels] = useState<string[]>(['IN_APP']);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const data = await getAlertRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadRules(true);
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r))
    );

    const success = await toggleAlertRule(ruleId, !currentEnabled);
    if (!success) {
      // Revert on failure
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: currentEnabled } : r))
      );
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    Alert.alert('Delete Rule', 'Are you sure you want to delete this rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const success = await deleteAlertRule(ruleId);
          if (success) {
            setRules((prev) => prev.filter((r) => r.id !== ruleId));
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormTriggerType('READINESS_DROP');
    setFormThreshold('');
    setFormThresholdString('');
    setFormTimeWindow('7');
    setFormMinOccurrences('3');
    setFormChannels(['IN_APP']);
  };

  const handleCreateRule = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter a rule name');
      return;
    }

    if (formChannels.length === 0) {
      Alert.alert('Error', 'Please select at least one notification channel');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newRule = await createAlertRule({
      name: formName.trim(),
      description: formDescription.trim() || null,
      triggerType: formTriggerType,
      threshold: formThreshold ? Number(formThreshold) : null,
      thresholdString: formThresholdString || null,
      timeWindowDays: formTimeWindow ? Number(formTimeWindow) : null,
      minOccurrences: formMinOccurrences ? Number(formMinOccurrences) : null,
      channels: formChannels,
    });

    if (newRule) {
      setRules((prev) => [newRule, ...prev]);
      setShowCreateModal(false);
      resetForm();
    }
  };

  const toggleChannel = (channel: string) => {
    setFormChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const selectedTrigger = TRIGGER_TYPES.find((t) => t.value === formTriggerType);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, Colors.card]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading alert rules...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#f59e0b', '#d97706', '#b45309']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Alert Rules</Text>
              <Text style={styles.headerSubtitle}>Proactive Monitoring</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreateModal(true);
              }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#f59e0b" />
          <Text style={styles.infoText}>
            Create rules to automatically monitor athletes and get notified when conditions are met.
          </Text>
        </View>

        {/* Rules List */}
        {rules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Alert Rules</Text>
            <Text style={styles.emptySubtitle}>
              Create your first rule to start monitoring athletes
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>Create Rule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rulesList}>
            {rules.map((rule) => (
              <View
                key={rule.id}
                style={[
                  styles.ruleCard,
                  !rule.isEnabled && styles.ruleCardDisabled,
                ]}
              >
                <View style={styles.ruleHeader}>
                  <View
                    style={[
                      styles.ruleIcon,
                      {
                        backgroundColor: rule.isEnabled
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(107, 114, 128, 0.2)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTriggerIcon(rule.triggerType) as any}
                      size={20}
                      color={rule.isEnabled ? '#f59e0b' : '#6b7280'}
                    />
                  </View>
                  <View style={styles.ruleInfo}>
                    <Text
                      style={[styles.ruleName, !rule.isEnabled && styles.ruleNameDisabled]}
                    >
                      {rule.name}
                    </Text>
                    <Text style={styles.ruleTrigger}>{formatTriggerLabel(rule)}</Text>
                  </View>
                  <Switch
                    value={rule.isEnabled}
                    onValueChange={() => handleToggleRule(rule.id, rule.isEnabled)}
                    trackColor={{ false: '#374151', true: 'rgba(245, 158, 11, 0.5)' }}
                    thumbColor={rule.isEnabled ? '#f59e0b' : '#9ca3af'}
                  />
                </View>

                {rule.description && (
                  <Text style={styles.ruleDescription}>{rule.description}</Text>
                )}

                <View style={styles.ruleFooter}>
                  <View style={styles.channelIcons}>
                    {rule.channels.includes('IN_APP') && (
                      <Ionicons name="notifications" size={14} color="#6b7280" />
                    )}
                    {rule.channels.includes('EMAIL') && (
                      <Ionicons name="mail" size={14} color="#6b7280" />
                    )}
                    {rule.channels.includes('SMS') && (
                      <Ionicons name="phone-portrait" size={14} color="#6b7280" />
                    )}
                  </View>
                  {rule.triggerCount > 0 && (
                    <Text style={styles.triggerCount}>
                      Triggered {rule.triggerCount}x
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteRule(rule.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Rule Types Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rule Types</Text>
          <View style={styles.typesGrid}>
            <View style={styles.typeCard}>
              <Ionicons name="trending-down" size={20} color="#3b82f6" />
              <Text style={styles.typeTitle}>Readiness</Text>
              <Text style={styles.typeDesc}>Track low scores</Text>
            </View>
            <View style={styles.typeCard}>
              <Ionicons name="person-remove" size={20} color="#8b5cf6" />
              <Text style={styles.typeTitle}>Engagement</Text>
              <Text style={styles.typeDesc}>Monitor inactivity</Text>
            </View>
            <View style={styles.typeCard}>
              <Ionicons name="chatbubble" size={20} color="#10b981" />
              <Text style={styles.typeTitle}>Sentiment</Text>
              <Text style={styles.typeDesc}>Detect negativity</Text>
            </View>
            <View style={styles.typeCard}>
              <Ionicons name="pricetag" size={20} color="#f59e0b" />
              <Text style={styles.typeTitle}>Topics</Text>
              <Text style={styles.typeDesc}>Watch for keywords</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Rule Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[Colors.background, Colors.card]}
            style={StyleSheet.absoluteFill}
          />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Rule</Text>
            <TouchableOpacity onPress={handleCreateRule}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Rule Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rule Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g., Low Readiness Alert"
                placeholderTextColor="#6b7280"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.formInput}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Optional description"
                placeholderTextColor="#6b7280"
              />
            </View>

            {/* Trigger Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Trigger Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formTriggerType}
                  onValueChange={setFormTriggerType}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {TRIGGER_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
              {selectedTrigger && (
                <Text style={styles.formHelp}>{selectedTrigger.description}</Text>
              )}
            </View>

            {/* Threshold (numeric) */}
            {selectedTrigger?.requiresThreshold && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Threshold Value *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formThreshold}
                  onChangeText={setFormThreshold}
                  placeholder={
                    formTriggerType === 'READINESS_DROP'
                      ? 'e.g., 50 (readiness score)'
                      : formTriggerType.includes('INACTIVITY')
                        ? 'e.g., 5 (days)'
                        : 'Enter value'
                  }
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Theme Selection */}
            {selectedTrigger?.requiresThresholdString && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Topic to Monitor *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formThresholdString}
                    onValueChange={setFormThresholdString}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select a topic..." value="" />
                    {THEME_OPTIONS.map((theme) => (
                      <Picker.Item
                        key={theme}
                        label={theme.replace(/-/g, ' ')}
                        value={theme}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Time Window */}
            {selectedTrigger?.requiresTimeWindow && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time Window (days)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formTimeWindow}
                  onChangeText={setFormTimeWindow}
                  placeholder="e.g., 7"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Min Occurrences */}
            {selectedTrigger?.requiresMinOccurrences && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Minimum Count</Text>
                <TextInput
                  style={styles.formInput}
                  value={formMinOccurrences}
                  onChangeText={setFormMinOccurrences}
                  placeholder="e.g., 3"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Notification Channels */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notification Channels *</Text>
              <View style={styles.channelsRow}>
                <TouchableOpacity
                  style={[
                    styles.channelButton,
                    formChannels.includes('IN_APP') && styles.channelButtonActive,
                  ]}
                  onPress={() => toggleChannel('IN_APP')}
                >
                  <Ionicons
                    name="notifications"
                    size={18}
                    color={formChannels.includes('IN_APP') ? '#f59e0b' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.channelButtonText,
                      formChannels.includes('IN_APP') && styles.channelButtonTextActive,
                    ]}
                  >
                    In-App
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.channelButton,
                    formChannels.includes('EMAIL') && styles.channelButtonActive,
                  ]}
                  onPress={() => toggleChannel('EMAIL')}
                >
                  <Ionicons
                    name="mail"
                    size={18}
                    color={formChannels.includes('EMAIL') ? '#f59e0b' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.channelButtonText,
                      formChannels.includes('EMAIL') && styles.channelButtonTextActive,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.channelButton,
                    formChannels.includes('SMS') && styles.channelButtonActive,
                  ]}
                  onPress={() => toggleChannel('SMS')}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={18}
                    color={formChannels.includes('SMS') ? '#f59e0b' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.channelButtonText,
                      formChannels.includes('SMS') && styles.channelButtonTextActive,
                    ]}
                  >
                    SMS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sm,
    color: '#fbbf24',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: '#fff',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  createButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#f59e0b',
    borderRadius: BorderRadius.lg,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.base,
  },
  rulesList: {
    gap: Spacing.md,
  },
  ruleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleCardDisabled: {
    opacity: 0.6,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#fff',
  },
  ruleNameDisabled: {
    color: '#9ca3af',
  },
  ruleTrigger: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ruleDescription: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    marginLeft: 52,
  },
  ruleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginLeft: 52,
    gap: Spacing.md,
  },
  channelIcons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  triggerCount: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
    marginTop: Spacing.xs,
  },
  typeDesc: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  bottomPadding: {
    height: 40,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCancel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#fff',
  },
  modalSave: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#f59e0b',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formHelp: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  pickerItem: {
    color: '#fff',
    fontSize: Typography.base,
  },
  channelsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  channelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  channelButtonActive: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  channelButtonText: {
    fontSize: Typography.sm,
    color: '#6b7280',
  },
  channelButtonTextActive: {
    color: '#f59e0b',
  },
});
