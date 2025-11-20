// components/VoidStatus.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Easing,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface VoidStatusProps {
  onBack: () => void;
  userProfile: any;
}

type PubStatus = 'open' | 'closed' | 'unknown' | 'maybe';
type StatusConfidence = 'high' | 'medium' | 'low';
type ReportType = 'status' | 'bartender' | 'event' | 'specials' | 'issue';

interface StatusReport {
  id: string;
  type: ReportType;
  userId: string;
  userName: string;
  timestamp: Date;
  status?: PubStatus;
  confidence: StatusConfidence;
  message?: string;
  bartenderName?: string;
  eventType?: string;
  specials?: string[];
  upvotes: string[];
  downvotes: string[];
  verified: boolean;
}

interface PubMetrics {
  openProbability: number;
  lastConfirmed: Date | null;
  averageOpenTime: string;
  reliabilityScore: number;
  currentWaitTime: number;
  vibeScore: number;
  lastUpdated: Date | null; // Added missing property
}

export default function VoidStatus({ onBack, userProfile }: VoidStatusProps) {
  const [pubStatus, setPubStatus] = useState<PubStatus>('unknown');
  const [statusReports, setStatusReports] = useState<StatusReport[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'reports' | 'metrics'>('status');
  const [newReportType, setNewReportType] = useState<ReportType>('status');
  const [reportMessage, setReportMessage] = useState('');
  const [bartenderName, setBartenderName] = useState('');
  const [eventType, setEventType] = useState('');
  const [specialsList, setSpecialsList] = useState('');
  const [pubMetrics, setPubMetrics] = useState<PubMetrics>({
    openProbability: 0,
    lastConfirmed: null,
    averageOpenTime: '3:00 PM',
    reliabilityScore: 68,
    currentWaitTime: 0,
    vibeScore: 50,
    lastUpdated: null // Added missing property
  });

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const statusGlow = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Initialize with mock data
  useEffect(() => {
    loadStatusData();
    startAnimations();
  }, []);

  useEffect(() => {
    calculateMetrics();
  }, [statusReports]);

  const startAnimations = () => {
    // Status pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(statusGlow, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Background pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadStatusData = () => {
    // Mock data - in real app, this would come from backend
    const mockReports: StatusReport[] = [
      {
        id: '1',
        type: 'status',
        userId: 'regular1',
        userName: 'PubExpert42',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        status: 'open',
        confidence: 'high',
        message: 'Just walked by, lights on and door unlocked!',
        upvotes: ['user1', 'user2', 'user3'],
        downvotes: [],
        verified: true
      },
      {
        id: '2',
        type: 'bartender',
        userId: 'user123',
        userName: 'BeerLover',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        confidence: 'medium',
        bartenderName: 'Mike',
        message: 'Mike is behind the bar looking somewhat awake',
        upvotes: ['user1', 'user2'],
        downvotes: [],
        verified: false
      },
      {
        id: '3',
        type: 'specials',
        userId: 'user456',
        userName: 'WhiskeyWizard',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        confidence: 'low',
        specials: ['£4 pints', 'Half-price wings'],
        message: 'Heard rumors about tonight specials',
        upvotes: ['user1'],
        downvotes: ['user3'],
        verified: false
      }
    ];

    setStatusReports(mockReports);
    calculateCurrentStatus(mockReports);
  };

  const calculateCurrentStatus = (reports: StatusReport[]) => {
    const recentStatusReports = reports
      .filter(r => r.type === 'status' && 
        new Date().getTime() - r.timestamp.getTime() < 2 * 60 * 60 * 1000) // Last 2 hours
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentStatusReports.length === 0) {
      setPubStatus('unknown');
      return;
    }

    const latestReport = recentStatusReports[0];
    setPubStatus(latestReport.status || 'unknown');
  };

  const calculateMetrics = () => {
    const recentReports = statusReports.filter(r => 
      new Date().getTime() - r.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const openReports = recentReports.filter(r => r.status === 'open');
    const totalStatusReports = recentReports.filter(r => r.type === 'status');
    
    const probability = totalStatusReports.length > 0 
      ? (openReports.length / totalStatusReports.length) * 100 
      : 0;

    const lastConfirmed = recentReports
      .filter(r => r.verified)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp || null;

    setPubMetrics(prev => ({
      ...prev,
      openProbability: Math.round(probability),
      lastConfirmed,
      lastUpdated: new Date(), // Update lastUpdated
      reliabilityScore: Math.max(30, Math.min(95, probability + 30)), // Fake but believable
      currentWaitTime: Math.floor(Math.random() * 20), // Random wait time
      vibeScore: 40 + Math.floor(Math.random() * 40) // Random vibe
    }));
  };

  const submitReport = () => {
    if (!reportMessage.trim() && newReportType !== 'status') {
      Alert.alert('Oops!', 'Please add a message for your report');
      return;
    }

    const newReport: StatusReport = {
      id: Date.now().toString(),
      type: newReportType,
      userId: userProfile?.id || 'anonymous',
      userName: userProfile?.name || 'Anonymous Patron',
      timestamp: new Date(),
      confidence: 'medium',
      message: reportMessage,
      upvotes: [],
      downvotes: [],
      verified: false
    };

    // Add type-specific data
    switch (newReportType) {
      case 'status':
        newReport.status = pubStatus === 'open' ? 'closed' : 'open';
        newReport.confidence = 'high';
        break;
      case 'bartender':
        newReport.bartenderName = bartenderName;
        break;
      case 'event':
        newReport.eventType = eventType;
        break;
      case 'specials':
        newReport.specials = specialsList.split(',').map(s => s.trim()).filter(s => s);
        break;
    }

    // Add to reports
    setStatusReports(prev => [newReport, ...prev]);
    
    // Trigger confetti for status changes
    if (newReportType === 'status') {
      triggerConfetti();
    }

    // Reset form
    setReportMessage('');
    setBartenderName('');
    setEventType('');
    setSpecialsList('');
    setShowReportModal(false);

    Alert.alert(
      'Report Submitted!',
      'Thanks for helping the community! 🍻',
      [{ text: 'Cheers!', style: 'default' }]
    );
  };

  const triggerConfetti = () => {
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVote = (reportId: string, isUpvote: boolean) => {
    setStatusReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const userId = userProfile?.id || 'anonymous';
        const newUpvotes = isUpvote 
          ? [...new Set([...report.upvotes, userId])].filter(id => !report.downvotes.includes(id))
          : report.upvotes.filter(id => id !== userId);
        
        const newDownvotes = !isUpvote
          ? [...new Set([...report.downvotes, userId])].filter(id => !report.upvotes.includes(id))
          : report.downvotes.filter(id => id !== userId);

        return {
          ...report,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          verified: newUpvotes.length >= 3 // Auto-verify with 3 upvotes
        };
      }
      return report;
    }));
  };

  const getStatusColor = () => {
    switch (pubStatus) {
      case 'open': return '#4CAF50';
      case 'closed': return '#F44336';
      case 'maybe': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (pubStatus) {
      case 'open': return '🏪';
      case 'closed': return '🔒';
      case 'maybe': return '❓';
      default: return '🌫️';
    }
  };

  const getStatusText = () => {
    switch (pubStatus) {
      case 'open': return 'OPEN FOR BUSINESS!';
      case 'closed': return 'CLOSED (Probably)';
      case 'maybe': return 'MAYBE OPEN?';
      default: return 'STATUS UNKNOWN';
    }
  };

  const getConfidenceText = (confidence: StatusConfidence) => {
    switch (confidence) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const diff = Math.floor((new Date().getTime() - timestamp.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  // Animation interpolations
  const statusScale = statusGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05]
  });

  const statusOpacity = statusGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3]
  });

  const confettiScale = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  // Custom icon components to replace Ionicons
  const Icon = ({ name, size = 24, color = '#ffffff' }: { name: string; size?: number; color?: string }) => {
    const icons: { [key: string]: string } = {
      'chevron-back': '⬅️',
      'megaphone': '📢',
      'close': '❌',
      'thumbs-up': '👍',
      'thumbs-down': '👎',
      'checkmark-circle': '✅'
    };

    return (
      <Text style={{ fontSize: size, color }}>
        {icons[name] || '❓'}
      </Text>
    );
  };

  const renderStatusCard = () => (
    <Animated.View 
      style={[
        styles.statusCard,
        { 
          borderColor: getStatusColor(),
          transform: [{ scale: statusScale }],
          opacity: statusOpacity
        }
      ]}
    >
      <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{pubMetrics.openProbability}%</Text>
          <Text style={styles.metricLabel}>Open Chance</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{pubMetrics.reliabilityScore}%</Text>
          <Text style={styles.metricLabel}>Reliability</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{pubMetrics.currentWaitTime}m</Text>
          <Text style={styles.metricLabel}>Wait Time</Text>
        </View>
      </View>

      <Text style={styles.lastUpdated}>
        Last confirmed: {pubMetrics.lastConfirmed 
          ? getTimeAgo(pubMetrics.lastConfirmed) 
          : 'Never'}
      </Text>
    </Animated.View>
  );

  const renderReportsList = () => (
    <ScrollView style={styles.reportsList}>
      {statusReports.map((report) => (
        <View key={report.id} style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.reportMeta}>
              <Text style={styles.reportUser}>{report.userName}</Text>
              <Text style={styles.reportTime}>{getTimeAgo(report.timestamp)}</Text>
            </View>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: report.confidence === 'high' ? '#4CAF50' : report.confidence === 'medium' ? '#FF9800' : '#F44336' }
            ]}>
              <Text style={styles.confidenceText}>
                {getConfidenceText(report.confidence)}
              </Text>
            </View>
          </View>

          <Text style={styles.reportMessage}>{report.message}</Text>
          
          {report.bartenderName && (
            <Text style={styles.reportDetail}>Bartender: {report.bartenderName}</Text>
          )}
          
          {report.specials && report.specials.length > 0 && (
            <View style={styles.specialsList}>
              {report.specials.map((special, index) => (
                <Text key={index} style={styles.specialItem}>• {special}</Text>
              ))}
            </View>
          )}

          <View style={styles.reportFooter}>
            <View style={styles.voteButtons}>
              <TouchableOpacity 
                style={styles.voteButton}
                onPress={() => handleVote(report.id, true)}
              >
                <Icon name="thumbs-up" size={16} color="#4CAF50" />
                <Text style={styles.voteCount}>{report.upvotes.length}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.voteButton}
                onPress={() => handleVote(report.id, false)}
              >
                <Icon name="thumbs-down" size={16} color="#F44336" />
                <Text style={styles.voteCount}>{report.downvotes.length}</Text>
              </TouchableOpacity>
            </View>

            {report.verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderMetrics = () => (
    <ScrollView style={styles.metricsContainer}>
      <View style={styles.metricSection}>
        <Text style={styles.sectionTitle}>Pub Reliability</Text>
        <View style={styles.scoreMeter}>
          <View 
            style={[
              styles.scoreFill,
              { width: `${pubMetrics.reliabilityScore}%` }
            ]} 
          />
          <Text style={styles.scoreText}>{pubMetrics.reliabilityScore}%</Text>
        </View>
        <Text style={styles.metricDescription}>
          Based on historical accuracy of status reports
        </Text>
      </View>

      <View style={styles.metricSection}>
        <Text style={styles.sectionTitle}>Opening Patterns</Text>
        <View style={styles.patternGrid}>
          <View style={styles.patternItem}>
            <Text style={styles.patternValue}>68%</Text>
            <Text style={styles.patternLabel}>On Time Opens</Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternValue}>3:14 PM</Text>
            <Text style={styles.patternLabel}>Average Open Time</Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternValue}>2.1h</Text>
            <Text style={styles.patternLabel}>Avg Delay</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricSection}>
        <Text style={styles.sectionTitle}>Community Trust</Text>
        <View style={styles.trustList}>
          <View style={styles.trustItem}>
            <Text style={styles.trustName}>PubExpert42</Text>
            <Text style={styles.trustScore}>94% accurate</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustName}>BeerLover</Text>
            <Text style={styles.trustScore}>87% accurate</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustName}>WhiskeyWizard</Text>
            <Text style={styles.trustScore}>76% accurate</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderReportModal = () => (
    <Modal visible={showReportModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Report</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalSectionTitle}>Report Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportTypeSelector}>
              {[
                { type: 'status', icon: '🏪', label: 'Status' },
                { type: 'bartender', icon: '👨‍💼', label: 'Bartender' },
                { type: 'event', icon: '🎉', label: 'Event' },
                { type: 'specials', icon: '💰', label: 'Specials' },
                { type: 'issue', icon: '⚠️', label: 'Issue' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.reportTypeButton,
                    newReportType === item.type && styles.reportTypeButtonActive
                  ]}
                  onPress={() => setNewReportType(item.type as ReportType)}
                >
                  <Text style={styles.reportTypeIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.reportTypeLabel,
                    newReportType === item.type && styles.reportTypeLabelActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {newReportType === 'bartender' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bartender Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={bartenderName}
                  onChangeText={setBartenderName}
                  placeholder="Who did you see?"
                />
              </View>
            )}

            {newReportType === 'event' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={eventType}
                  onChangeText={setEventType}
                  placeholder="Live music, quiz night, etc."
                />
              </View>
            )}

            {newReportType === 'specials' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Today's Specials</Text>
                <TextInput
                  style={styles.textInput}
                  value={specialsList}
                  onChangeText={setSpecialsList}
                  placeholder="£4 pints, half-price wings..."
                  multiline
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Details</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={reportMessage}
                onChangeText={setReportMessage}
                placeholder="Add any extra information..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitReport}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Background */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
        <LinearGradient
          colors={['#1a0033', '#000000', '#1a0033']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Confetti Overlay */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          { 
            opacity: confettiAnim,
            transform: [{ scale: confettiScale }],
            pointerEvents: 'none'
          }
        ]}
      >
        <Text style={styles.confettiText}>🎉</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#00ffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>VOID STATUS</Text>
          <Text style={styles.subtitle}>Community Pub Tracker</Text>
        </View>

        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Icon name="megaphone" size={20} color="#ff00ff" />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'status', label: 'Status', icon: '🏪' },
          { key: 'reports', label: 'Reports', icon: '📋' },
          { key: 'metrics', label: 'Metrics', icon: '📊' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'status' && renderStatusCard()}
        {activeTab === 'reports' && renderReportsList()}
        {activeTab === 'metrics' && renderMetrics()}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => {
            setNewReportType('status');
            setPubStatus('open');
            setShowReportModal(true);
          }}
        >
          <Text style={styles.quickButtonText}>✅ OPEN</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: '#F44336' }]}
          onPress={() => {
            setNewReportType('status');
            setPubStatus('closed');
            setShowReportModal(true);
          }}
        >
          <Text style={styles.quickButtonText}>❌ CLOSED</Text>
        </TouchableOpacity>
      </View>

      {renderReportModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  reportButton: {
    padding: 10,
    backgroundColor: 'rgba(255,0,255,0.2)',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  lastUpdated: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportMeta: {
    flex: 1,
  },
  reportUser: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reportTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportMessage: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  reportDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  specialsList: {
    marginBottom: 8,
  },
  specialItem: {
    color: '#ffff00',
    fontSize: 12,
    marginBottom: 2,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteButtons: {
    flexDirection: 'row',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginRight: 8,
  },
  voteCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  metricsContainer: {
    flex: 1,
  },
  metricSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scoreMeter: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  scoreText: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -15 }, { translateY: -8 }],
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  patternGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patternItem: {
    alignItems: 'center',
    flex: 1,
  },
  patternValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patternLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
  },
  trustList: {
    // Add trust list styles
  },
  trustItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trustName: {
    color: '#ffffff',
    fontSize: 14,
  },
  trustScore: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 15,
    gap: 10,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reportTypeSelector: {
    marginBottom: 20,
  },
  reportTypeButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginRight: 10,
    minWidth: 80,
  },
  reportTypeButtonActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  reportTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportTypeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  reportTypeLabelActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confettiText: {
    fontSize: 100,
    textAlign: 'center',
    marginTop: 100,
  },
});