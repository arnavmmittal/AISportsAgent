import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>AI Chat Assistant</Text>
        <Text style={styles.subtitle}>Full chat implementation coming in Phase 3</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            This screen will include:
          </Text>
          <Text style={styles.bulletPoint}>• Real-time chat with streaming responses</Text>
          <Text style={styles.bulletPoint}>• Session history</Text>
          <Text style={styles.bulletPoint}>• Voice input support</Text>
          <Text style={styles.bulletPoint}>• Crisis detection and safety features</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    fontWeight: '500',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    paddingLeft: 8,
  },
});
