/**
 * Admin Schools Management
 * View and create schools
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function SchoolsScreen() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', division: 'D1' });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const data = await apiClient.getSchools();
      setSchools(data);
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!newSchool.name.trim()) {
      Alert.alert('Error', 'Please enter a school name');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiClient.createSchool(newSchool);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setIsModalVisible(false);
      setNewSchool({ name: '', division: 'D1' });
      loadSchools();

      Alert.alert('Success', 'School created successfully');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create school');
    }
  };

  const renderSchool = ({ item }: { item: any }) => (
    <View style={styles.schoolCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.schoolHeader}>
          <View style={styles.schoolIconContainer}>
            <Ionicons name="business" size={24} color="#a855f7" />
          </View>
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{item.name}</Text>
            <Text style={styles.schoolDivision}>{item.division}</Text>
          </View>
        </View>
        <View style={styles.schoolStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item._count?.users || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#a855f7', '#9333ea']}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Schools</Text>
            <Text style={styles.headerSubtitle}>{schools.length} total</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <FlatList
        data={schools}
        renderItem={renderSchool}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Create School Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0f172a', '#1e293b']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New School</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleCreateSchool();
              }}
            >
              <Text style={styles.modalSave}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>School Name *</Text>
            <TextInput
              style={styles.input}
              value={newSchool.name}
              onChangeText={(text) => setNewSchool({ ...newSchool, name: text })}
              placeholder="e.g., University of Washington"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={100}
            />

            <Text style={styles.label}>Division</Text>
            <View style={styles.divisionContainer}>
              {['D1', 'D2', 'D3', 'NAIA'].map((div) => (
                <TouchableOpacity
                  key={div}
                  style={[styles.divisionChip, newSchool.division === div && styles.divisionChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNewSchool({ ...newSchool, division: div });
                  }}
                >
                  <Text style={[styles.divisionText, newSchool.division === div && styles.divisionTextActive]}>
                    {div}
                  </Text>
                </TouchableOpacity>
              ))}
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
  header: {
    paddingTop: 60,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  addButton: {
    position: 'absolute',
    top: 8,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  schoolCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  schoolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  schoolDivision: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  schoolStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#a855f7',
  },
  statLabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
  },
  modalCancel: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  modalSave: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: '#a855f7',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: '#fff',
  },
  divisionContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  divisionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  divisionChipActive: {
    backgroundColor: '#a855f7',
    borderColor: '#c084fc',
  },
  divisionText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  divisionTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
});
