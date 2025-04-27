// Chat.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  orderBy, 
  serverTimestamp, 
  setDoc, 
  doc,
} from 'firebase/firestore';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  render() {
    if (this.state.hasError) {
      return <Text style={styles.errorText}>Something went wrong. Please try again later.</Text>;
    }
    return this.props.children;
  }
}

// Recent Chats Screen
const RecentChatsScreen = ({ navigation }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const currentUser = auth.currentUser;

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = {};
      snapshot.docs.forEach(doc => {
        usersData[doc.id] = doc.data().username;
      });
      setUsers(usersData);
    }, (error) => setLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        unread: doc.data().lastMessageSeenBy?.includes(currentUser.uid) ? false : true
      }));

      const uniqueChats = Array.from(
        new Map(chatsData.map(chat => {
          const sortedParticipants = chat.participants.sort().join('_');
          return [`${chat.id}-${sortedParticipants}`, chat];
        })).values()
      );

      setRecentChats(uniqueChats);
      setLoading(false);
    }, (error) => setLoading(false));

    return () => unsubscribe();
  }, [currentUser.uid]);

  const renderRecentChat = ({ item }) => {
    const otherUserId = item.participants.find(id => id !== currentUser.uid);
    const username = users[otherUserId] || otherUserId;

    return (
      <TouchableOpacity 
        style={[styles.chatItem, item.unread && styles.unreadChat]}
        onPress={() => navigation.navigate('IndividualChat', { userId: otherUserId })}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.avatarText}>{username[0]}</Text>
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{username}</Text>
          {/* Removed lastMessage display */}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Chats</Text>
      <FlatList
        data={recentChats}
        renderItem={renderRecentChat}
        keyExtractor={item => `${item.id}-${item.participants.sort().join('_')}`}
        ListEmptyComponent={<Text style={styles.emptyText}>No recent chats yet</Text>}
        contentContainerStyle={styles.flatListContent}
      />
      <TouchableOpacity 
        style={styles.plusButton}
        onPress={() => navigation.navigate('UsersList')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Users List Screen
const UsersListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser.uid);
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start a New Chat</Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userItem}
            onPress={() => navigation.navigate('IndividualChat', { userId: item.id })}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{item.username[0]}</Text>
            </View>
            <Text style={styles.userName}>{item.username}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No users available</Text>}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

// Individual Chat Screen
const IndividualChatScreen = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState({});
  const currentUser = auth.currentUser;
  const { userId } = route.params;

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = {};
      snapshot.docs.forEach(doc => {
        usersData[doc.id] = doc.data().username;
      });
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const chatId = [currentUser.uid, userId].sort().join('_');
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (msgSnapshot) => {
      const messagesData = msgSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
      setDoc(doc(db, 'chats', chatId), {
        lastMessageSeenBy: [currentUser.uid]
      }, { merge: true });
    });

    return () => unsubscribe();
  }, [userId]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const chatId = [currentUser.uid, userId].sort().join('_');
    const messageData = {
      text: message,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUser.uid, userId],
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        lastMessageSeenBy: [currentUser.uid]
      }, { merge: true });
      setMessage('');
    } catch (error) {
      // Silent error handling
    }
  };

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeaderContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.chatHeader}>{users[userId] || userId}</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.senderId === currentUser.uid ? styles.sentMessage : styles.receivedMessage
          ]}>
            <Text style={[
              styles.senderName,
              item.senderId !== currentUser.uid && styles.receivedSenderName
            ]}>
              {item.senderId === currentUser.uid ? 'You' : (users[item.senderId] || item.senderId)}
            </Text>
            <Text style={[
              styles.messageText,
              item.senderId !== currentUser.uid && styles.receivedMessageText
            ]}>
              {item.text}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesListContent}
      />
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Chat Component
export default function Chat() {
  return (
    <ErrorBoundary>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="RecentChats" component={RecentChatsScreen} />
        <Stack.Screen name="UsersList" component={UsersListScreen} />
        <Stack.Screen name="IndividualChat" component={IndividualChatScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unreadChat: {
    backgroundColor: '#e6f0ff',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  plusButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeaderContainer: {
    backgroundColor: '#007AFF',
    padding: 15,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  chatHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  messageBubble: {
    padding: 12,
    margin: 8,
    borderRadius: 15,
    maxWidth: '75%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sentMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
  },
  receivedSenderName: {
    color: '#333',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  receivedMessageText: {
    color: '#333',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f7f9fc',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    color: '#ff3333',
    padding: 20,
    fontSize: 16,
  },
  flatListContent: {
    paddingBottom: 80,
  },
  messagesListContent: {
    padding: 10,
    paddingBottom: 20,
  },
});