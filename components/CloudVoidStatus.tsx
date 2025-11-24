import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './AuthContext';
import { CloudService } from '../services/CloudService';

const { width } = Dimensions.get('window');

interface CloudStatusProps {
  onBack: () => void;
}

interface StatusData {
  id: string;
  pub_alias: string;
  status: string;
  chaos_level: number;
  location: string;
  timestamp: number;
  drinks_consumed: number;
  verified: boolean;
  source: 'local' | 'cloud' | 'user';
  device_id?: string;
  distance?: string;
  isUser?: boolean;
}

export default function CloudVoidStatus({ onBack }: CloudStatusProps) {
  const { user, isOnline } = useAuth();
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [localStatuses, setLocalStatuses] = useState<StatusData[]>([]);
  const [cloudStatuses, setCloudStatuses] = useState<StatusData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  const [reactions, setReactions] = useState<{[statusId: string]: string[]}>({});
  const [activeGroup, setActiveGroup] = useState<'public' | string>('public');
  const [userGroups, setUserGroups] = useState<string[]>(['public', 'secret-coders', 'void-explorers']);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'cloud' && isOnline) {
      loadCloudData();
    }
  }, [activeTab, isOnline]);

  const loadInitialData = async () => {
    const localData = await loadLocalStatuses();
    setLocalStatuses(localData);

    if (isOnline) {
      await loadCloudData();
    }
  };

  const loadCloudData = async () => {
    if (!isOnline) {
      console.log('📴 Skipping cloud load - offline');
      return;
    }

    console.log('☁️ Loading cloud data from Supabase...');
    setLoading(true);
    
    try {
      const cloudData = await CloudService.getRecentStatuses();
      
      const transformedData: StatusData[] = cloudData.map(item => ({
        id: item.id,
        pub_alias: item.pub_alias,
        status: item.status,
        chaos_level: item.chaos_level,
        location: item.location,
        timestamp: new Date(item.created_at).getTime(),
        drinks_consumed: item.drinks_consumed,
        verified: item.is_verified,
        source: 'cloud',
        device_id: item.device_id
      }));
      
      setCloudStatuses(transformedData);
      setLastUpdate(Date.now());
      console.log(`✅ Cloud data loaded: ${transformedData.length} statuses`);
      
    } catch (error) {
      console.error('❌ Failed to load cloud data:', error);
      Alert.alert('Cloud Sync Issue', 'Failed to load remote statuses. Using cached data.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStatuses = async (): Promise<StatusData[]> => {
    return [];
  };

  const deleteStatus = async (statusId: string) => {
    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete this status?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setLocalStatuses(prev => prev.filter(status => status.id !== statusId));
            setCloudStatuses(prev => prev.filter(status => status.id !== statusId));
            
            setReactions(prev => {
              const newReactions = { ...prev };
              delete newReactions[statusId];
              return newReactions;
            });
            
            console.log(`🗑️ Deleted status: ${statusId}`);
          }
        }
      ]
    );
  };

  const addReaction = (statusId: string, emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [statusId]: [...(prev[statusId] || []), emoji]
    }));
    console.log(`🎭 Added reaction ${emoji} to status ${statusId}`);
  };

  const onRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    
    try {
      if (activeTab === 'local') {
        const localData = await loadLocalStatuses();
        setLocalStatuses(localData);
        console.log('✅ Local data refreshed');
      } else if (isOnline) {
        await loadCloudData();
      } else {
        Alert.alert('Offline Mode', 'Cannot refresh cloud data while offline.');
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      Alert.alert('Refresh Failed', 'Could not update statuses. Try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const submitStatus = async (status: string, chaos: number) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please create a profile first.');
      return;
    }

    const deviceId = user.device_id || `fallback_${Date.now()}`;    

    const statusData = {
      device_id: deviceId,
      pub_alias: user.pub_alias || 'Anonymous Wanderer',
      status,
      chaos_level: chaos,
      location: 'The Void Tavern',
      drinks_consumed: 0
    };

    try {
      console.log('📤 Submitting status:', statusData);

      const localStatus: StatusData = {
        id: `local_${Date.now()}`,
        ...statusData,
        timestamp: Date.now(),
        verified: true,
        isUser: true,
        source: 'user'
      };
      
      setLocalStatuses(prev => [localStatus, ...prev]);

      let cloudSuccess = false;

      if (isOnline) {
        cloudSuccess = await CloudService.submitStatus(statusData);
        console.log(`📊 Cloud submission: ${cloudSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        if (cloudSuccess && activeTab === 'cloud') {
          setTimeout(() => loadCloudData(), 1000);
        }
      }

      if (isOnline) {
        if (cloudSuccess) {
          Alert.alert('🌀 Status Broadcasted!', 'Your status is now visible locally and across the void network!');
        } else {
          Alert.alert('📡 Partial Success', 'Status shared locally, but cloud sync failed. It will retry automatically.');
        }
      } else {
        Alert.alert('📡 Local Mode', 'Status saved locally. It will sync when back online.');
      }

    } catch (error) {
      console.error('❌ Error submitting status:', error);
      Alert.alert('Submission Error', 'Failed to submit status. Please try again.');
    }
  };

  const GroupSelector = () => (
    <View style={styles.groupSelector}>
      <Text style={styles.groupTitle}>VOID CIRCLE:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.groupScroll}
      >
        {userGroups.map(group => (
          <TouchableOpacity
            key={group}
            style={[styles.groupTab, activeGroup === group && styles.activeGroupTab]}
            onPress={() => setActiveGroup(group)}
          >
            <Text style={styles.groupText}>
              {group === 'public' ? '🌐 PUBLIC' : `🤫 ${group.toUpperCase()}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const StatusCard = ({ status, isUser = false }: { status: StatusData; isUser?: boolean }) => (
    <View style={[styles.statusCard, isUser && styles.userStatusCard]}>
      <View style={styles.statusHeader}>
        <Text style={styles.alias}>{status.pub_alias}</Text>
        <View style={styles.headerRight}>
          {status.verified && <Text style={styles.verified}>✅</Text>}
          {status.distance && <Text style={styles.distance}>{status.distance}</Text>}
          {status.source === 'cloud' && <Text style={styles.cloudBadge}>🌐</Text>}
          {status.source === 'user' && <Text style={styles.userBadge}>YOU</Text>}
          {isUser && (
            <TouchableOpacity onPress={() => deleteStatus(status.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.statusBody}>
        <View style={styles.statusRow}>
          <Text style={[styles.status, getStatusColor(status.status)]}>
            {status.status}
          </Text>
          <View style={[styles.chaosMeter, { width: `${Math.min(status.chaos_level, 100)}%` }]} />
        </View>
        <Text style={styles.chaos}>Chaos Level: {status.chaos_level}%</Text>
        <Text style={styles.location}>📍 {status.location}</Text>
      </View>
      
      <View style={styles.reactionsContainer}>
        <View style={styles.reactionButtons}>
          {['🔥', '😂', '🎯', '❤️', '👀'].map(emoji => (
            <TouchableOpacity 
              key={emoji} 
              onPress={() => addReaction(status.id, emoji)}
              style={styles.reactionButton}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {(reactions[status.id] || []).length > 0 && (
          <View style={styles.reactionDisplay}>
            <Text style={styles.reactionCount}>
              {reactions[status.id]?.join(' ')}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.statusFooter}>
        <Text style={styles.drinks}>🍻 {status.drinks_consumed}</Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(status.timestamp)}
          {status.source === 'cloud' && ' • Cloud'}
        </Text>
      </View>
      
      {isUser && <Text style={styles.youIndicator}>THIS IS YOU</Text>}
    </View>
  );

  const QuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.actionsTitle}>QUICK BROADCAST</Text>
      <View style={styles.actionRow}>
        {[
          { status: 'CHILL', chaos: 25, color: '#00ff00', emoji: '😌' },
          { status: 'SOCIAL', chaos: 50, color: '#00ffff', emoji: '💬' },
          { status: 'GAMING', chaos: 65, color: '#ff00ff', emoji: '🎮' },
          { status: 'CHAOTIC', chaos: 85, color: '#ffff00', emoji: '🎪' }
        ].map((action) => (
          <TouchableOpacity 
            key={action.status}
            style={[styles.actionBtn, { backgroundColor: action.color }]}
            onPress={() => submitStatus(action.status, action.chaos)}
          >
            <Text style={styles.actionEmoji}>{action.emoji}</Text>
            <Text style={styles.actionText}>{action.status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const currentStatuses = activeTab === 'local' ? localStatuses : cloudStatuses;
  const hasData = currentStatuses.length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0033', '#000000', '#1a0033']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>VOID STATUS</Text>
          <Text style={styles.subtitle}>
            {isOnline ? '🌐 CLOUD SYNC ACTIVE' : '📡 LOCAL MODE'}
            {activeTab === 'cloud' && ` • Updated ${formatTimestamp(lastUpdate)}`}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <GroupSelector />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'local' && styles.activeTab]}
          onPress={() => setActiveTab('local')}
        >
          <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>
            📡 LOCAL P2P
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cloud' && styles.activeTab]}
          onPress={() => setActiveTab('cloud')}
        >
          <Text style={[styles.tabText, activeTab === 'cloud' && styles.activeTabText]}>
            🌐 CLOUD NETWORK
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00ffff', '#ff00ff', '#ffff00']}
            tintColor="#00ffff"
            title="Pulling reality updates..."
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <QuickActions />
        
        <Text style={styles.sectionTitle}>
          {activeTab === 'local' ? 'NEARBY VOID DWELLERS' : 'GLOBAL VOID NETWORK'}
          {loading && ' 🔄'}
        </Text>

        {loading && activeTab === 'cloud' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00ffff" />
            <Text style={styles.loadingText}>Connecting to the void network...</Text>
          </View>
        )}

        {hasData ? (
          currentStatuses.map((status) => (
            <StatusCard 
              key={`${status.id}_${status.timestamp}`} 
              status={status} 
              isUser={status.isUser}
            />
          ))
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌌</Text>
              <Text style={styles.emptyTitle}>Silence in the Void</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'local' 
                  ? 'No nearby void dwellers detected. Be the first to broadcast your status!'
                  : 'No cloud statuses available. Check your connection or try local mode.'
                }
              </Text>
              {activeTab === 'cloud' && (!isOnline || (isOnline && cloudStatuses.length === 0)) && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadCloudData}
                >
                  <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )}

        <View style={[
          styles.connectionStatus, 
          isOnline ? styles.connectionOnline : styles.connectionOffline
        ]}>
          <Text style={styles.connectionText}>
            {isOnline ? '🟢 CONNECTED TO CLOUD' : '🔴 OFFLINE - LOCAL MODE'}
          </Text>
          <Text style={styles.connectionSubtext}>
            {isOnline 
              ? 'Your status broadcasts globally' 
              : 'Statuses saved locally until online'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'CHILL': '#00ff00',
    'SOCIAL': '#00ffff', 
    'GAMING': '#ff00ff',
    'DRINKING': '#ff8800',
    'CHAOTIC': '#ffff00',
    'OBSERVING': '#8844ff',
    'CHATTING': '#00ff88'
  };
  return { color: colors[status] || '#ffffff' };
};

const formatTimestamp = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

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
    padding: 10,
  },
  backText: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    color: '#00ff00',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  groupSelector: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  groupTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  groupScroll: {
    maxHeight: 40,
  },
  groupTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeGroupTab: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: '#8a2be2',
  },
  groupText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActions: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionsTitle: {
    color: '#ffff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  actionText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  userStatusCard: {
    borderColor: '#00ffff',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alias: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verified: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  distance: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginHorizontal: 4,
  },
  cloudBadge: {
    fontSize: 10,
    marginLeft: 4,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  userBadge: {
    fontSize: 8,
    marginLeft: 4,
    color: '#00ffff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  deleteText: {
    fontSize: 12,
    color: 'rgba(255,0,0,0.7)',
  },
  statusBody: {
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    flex: 1,
  },
  chaosMeter: {
    height: 6,
    backgroundColor: '#ff00ff',
    borderRadius: 3,
    maxWidth: 80,
  },
  chaos: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  location: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  reactionsContainer: {
    marginVertical: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  reactionButton: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionDisplay: {
    alignItems: 'center',
  },
  reactionCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drinks: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  youIndicator: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#00ffff',
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  connectionStatus: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  connectionOnline: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  connectionOffline: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  connectionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#00ffff',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginVertical: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ffff',
  },
  retryButtonText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});