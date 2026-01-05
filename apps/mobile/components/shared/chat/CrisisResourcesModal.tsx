/**
 * Crisis Resources Modal - Mobile Version
 * Displays emergency mental health resources when crisis is detected
 */

import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface CrisisAlert {
  final_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

interface CrisisResourcesModalProps {
  crisis: CrisisAlert | null;
  onClose: () => void;
}

const CRISIS_RESOURCES = {
  immediate: [
    {
      name: 'National Suicide Prevention Lifeline',
      contact: '988',
      description: '24/7 crisis support',
      type: 'phone',
      icon: 'call',
    },
    {
      name: 'Crisis Text Line',
      contact: '741741',
      textCommand: 'HOME',
      description: 'Text-based crisis support',
      type: 'text',
      icon: 'chatbubble',
    },
    {
      name: 'SAMHSA National Helpline',
      contact: '18006624357',
      display: '1-800-662-4357',
      description: 'Mental health & substance abuse',
      type: 'phone',
      icon: 'call',
    },
  ],
  campus: [
    {
      name: 'University Counseling Center',
      description: 'Free counseling services for students',
      icon: 'school',
    },
    {
      name: 'Your Coach',
      description: 'Your coach is here to support you',
      icon: 'people',
    },
  ],
  online: [
    {
      name: 'Crisis Chat',
      url: 'https://988lifeline.org/chat',
      description: 'Online chat with trained counselor',
      icon: 'globe',
    },
    {
      name: 'Mental Health Resources',
      url: 'https://www.mentalhealth.gov/get-help/immediate-help',
      description: 'Comprehensive mental health support',
      icon: 'information-circle',
    },
  ],
};

export function CrisisResourcesModal({ crisis, onClose }: CrisisResourcesModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const isVisible = crisis !== null && !acknowledged;

  const handleCall = (phoneNumber: string, displayName: string) => {
    Alert.alert(
      `Call ${displayName}?`,
      'You will be connected to 24/7 crisis support.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
          style: 'default',
        },
      ]
    );
  };

  const handleText = (number: string, message: string) => {
    Linking.openURL(`sms:${number}&body=${message}`);
  };

  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onClose();
  };

  const getSeverityColor = () => {
    switch (crisis?.final_risk_level) {
      case 'CRITICAL':
        return Colors.error;
      case 'HIGH':
        return '#FF6B00';
      case 'MEDIUM':
        return '#FFA500';
      default:
        return Colors.primary;
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleAcknowledge}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: getSeverityColor() }]}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="warning" size={28} color={Colors.error} />
            <Text style={styles.headerTitle}>We're Here to Help</Text>
          </View>
          <Text style={styles.headerDescription}>
            {crisis?.message ||
              "We noticed your message may indicate you're going through a difficult time. You don't have to face this alone - help is available 24/7."}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Immediate Crisis Resources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Crisis Support (24/7)</Text>
            {CRISIS_RESOURCES.immediate.map((resource, index) => (
              <View key={index} style={[styles.card, styles.emergencyCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={resource.icon as any} size={24} color={Colors.error} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{resource.name}</Text>
                    <Text style={styles.cardContact}>
                      {resource.type === 'text'
                        ? `Text ${resource.textCommand} to ${resource.contact}`
                        : resource.display || resource.contact}
                    </Text>
                    <Text style={styles.cardDescription}>{resource.description}</Text>
                  </View>
                </View>
                {resource.type === 'phone' && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(resource.contact, resource.name)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.callButtonText}>Call Now</Text>
                  </TouchableOpacity>
                )}
                {resource.type === 'text' && (
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={() => handleText(resource.contact, resource.textCommand!)}
                  >
                    <Ionicons name="chatbubble" size={18} color="#fff" />
                    <Text style={styles.textButtonText}>Text Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Campus Resources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campus Support</Text>
            {CRISIS_RESOURCES.campus.map((resource, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name={resource.icon as any} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{resource.name}</Text>
                    <Text style={styles.cardDescription}>{resource.description}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Online Resources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Online Support</Text>
            {CRISIS_RESOURCES.online.map((resource, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name={resource.icon as any} size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{resource.name}</Text>
                    <Text style={styles.cardDescription}>{resource.description}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleOpenURL(resource.url)}
                >
                  <Ionicons name="open-outline" size={18} color={Colors.primary} />
                  <Text style={styles.linkButtonText}>Visit Resource</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Important Message */}
          <View style={[styles.reminderCard, { borderLeftColor: getSeverityColor() }]}>
            <Text style={styles.reminderTitle}>Remember:</Text>
            <View style={styles.reminderList}>
              <Text style={styles.reminderItem}>
                • It's okay to ask for help - it's a sign of strength, not weakness
              </Text>
              <Text style={styles.reminderItem}>
                • You are not alone - many people care about your well-being
              </Text>
              <Text style={styles.reminderItem}>
                • Crisis situations are temporary - things can and do get better
              </Text>
              <Text style={styles.reminderItem}>
                • Professional support is available 24/7 at the numbers above
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.emergencyCallButton}
            onPress={() => handleCall('988', '988 Lifeline')}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.emergencyCallButtonText}>Call 988 Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acknowledgeButton} onPress={handleAcknowledge}>
            <Text style={styles.acknowledgeButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 3,
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginLeft: Spacing.sm,
  },
  headerDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyCard: {
    borderColor: '#FFCDD2',
    borderWidth: 2,
    backgroundColor: '#FFEBEE',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFCDD2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardContact: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  textButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  linkButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  reminderCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.xl,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: Spacing.sm,
  },
  reminderList: {
    gap: Spacing.xs,
  },
  reminderItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  emergencyCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  acknowledgeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
