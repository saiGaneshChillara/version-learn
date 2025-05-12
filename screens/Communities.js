import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

const initialCommunities = [
  {
    name: "Science Community",
    subjects: ["Physics 101", "Chemistry 201", "Biology 301"],
  },
  {
    name: "Humanities Community",
    subjects: ["History 401", "Literature 501", "Philosophy 601"],
  },
];

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [joinedSubjects, setJoinedSubjects] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [userType, setUserType] = useState(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDeleteCommunityModal, setShowDeleteCommunityModal] =
    useState(false);
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [deleteCommunityId, setDeleteCommunityId] = useState(null);
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  const flatListRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Initialize Firestore with default communities
  const initializeFirestore = useCallback(async () => {
    const communitiesSnapshot = await getDocs(collection(db, "communities"));
    if (communitiesSnapshot.empty) {
      for (const community of initialCommunities) {
        const communityRef = doc(collection(db, "communities"));
        await setDoc(communityRef, {
          name: community.name,
          createdAt: new Date(),
        });
        for (const subjectName of community.subjects) {
          const subjectRef = doc(
            collection(db, "communities", communityRef.id, "subjects")
          );
          await setDoc(subjectRef, {
            name: subjectName,
            createdAt: new Date(),
          });
        }
      }
    }
  }, []);

  // Fetch user type
  const fetchUserType = useCallback(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        setUserType(docSnap.data().userType);
      } else {
        Alert.alert("Error", "User profile not found.");
      }
    });
  }, [user]);

  // Fetch communities and subjects
  const fetchCommunities = useCallback(() => {
    const unsubscribe = onSnapshot(
      collection(db, "communities"),
      async (snapshot) => {
        const communitiesList = [];
        for (const communityDoc of snapshot.docs) {
          const subjectsSnapshot = await getDocs(
            collection(db, "communities", communityDoc.id, "subjects")
          );
          const subjects = subjectsSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }));
          communitiesList.push({
            id: communityDoc.id,
            name: communityDoc.data().name,
            subjects,
          });
        }
        setCommunities(communitiesList);
      }
    );
    return unsubscribe;
  }, []);

  // Fetch joined subjects
  const fetchJoinedSubjects = useCallback(() => {
    if (!user) return () => {};
    const unsubscribeList = communities.map((community) => {
      const joinedSubjectsRef = collection(
        db,
        "communities",
        community.id,
        "members",
        user.uid,
        "subjects"
      );
      return onSnapshot(joinedSubjectsRef, (snapshot) => {
        const joinedList = snapshot.docs.map((doc) => doc.id);
        setJoinedSubjects((prev) => ({
          ...prev,
          [community.id]: joinedList,
        }));
      });
    });
    return () => unsubscribeList.forEach((unsub) => unsub());
  }, [communities, user]);

  // Fetch messages and members
  const fetchSubjectData = useCallback(() => {
    if (!selectedSubject) {
      setMessages([]);
      setMembers([]);
      setShowMembers(false);
      return () => {};
    }

    const { communityId, subjectId } = selectedSubject;
    const messagesCollection = collection(
      db,
      "communities",
      communityId,
      "subjects",
      subjectId,
      "messages"
    );
    const unsubscribeMessages = onSnapshot(messagesCollection, (snapshot) => {
      const messagesList = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
      setMessages(messagesList);
    });

    const fetchMembers = async () => {
      try {
        const membersSnapshot = await getDocs(
          collection(
            db,
            "communities",
            communityId,
            "subjects",
            subjectId,
            "members"
          )
        );
        const membersList = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(membersList);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch members: " + error.message);
      }
    };
    fetchMembers();

    return unsubscribeMessages;
  }, [selectedSubject]);

  // Animate subject view
  useEffect(() => {
    Animated.timing(animation, {
      toValue: selectedSubject ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedSubject]);

  // Setup subscriptions
  useEffect(() => {
    initializeFirestore();
    fetchUserType();
    const unsubscribeCommunities = fetchCommunities();
    const unsubscribeSubjects = fetchJoinedSubjects();
    const unsubscribeMessages = fetchSubjectData();
    return () => {
      unsubscribeCommunities();
      unsubscribeSubjects();
      unsubscribeMessages();
    };
  }, [
    initializeFirestore,
    fetchUserType,
    fetchCommunities,
    fetchJoinedSubjects,
    fetchSubjectData,
  ]);

  // Handle joining a subject
  const handleJoinSubject = async (communityId, subjectId) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to join a subject.");
      return;
    }
    try {
      await Promise.all([
        setDoc(
          doc(
            db,
            "communities",
            communityId,
            "members",
            user.uid,
            "subjects",
            subjectId
          ),
          { email: user.email, joinedAt: new Date() }
        ),
        setDoc(
          doc(
            db,
            "communities",
            communityId,
            "subjects",
            subjectId,
            "members",
            user.uid
          ),
          { email: user.email, joinedAt: new Date() }
        ),
      ]);
      Alert.alert("Success", "Joined subject successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to join subject: " + error.message);
    }
  };

  // Handle leaving a subject
  const handleLeaveSubject = async (communityId, subjectId) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to leave a subject.");
      return;
    }
    try {
      await Promise.all([
        deleteDoc(
          doc(
            db,
            "communities",
            communityId,
            "members",
            user.uid,
            "subjects",
            subjectId
          )
        ),
        deleteDoc(
          doc(
            db,
            "communities",
            communityId,
            "subjects",
            subjectId,
            "members",
            user.uid
          )
        ),
      ]);
      if (
        selectedSubject &&
        selectedSubject.communityId === communityId &&
        selectedSubject.subjectId === subjectId
      ) {
        setSelectedSubject(null);
      }
      Alert.alert("Success", "Left subject successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to leave subject: " + error.message);
    }
  };

  // Handle adding a community
  const handleAddCommunity = async () => {
    if (!newCommunityName.trim()) {
      Alert.alert("Error", "Community name cannot be empty.");
      return;
    }
    try {
      const communityRef = doc(collection(db, "communities"));
      await setDoc(communityRef, {
        name: newCommunityName,
        createdAt: new Date(),
      });
      setNewCommunityName("");
      setShowCommunityModal(false);
      Alert.alert("Success", "Community added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add community: " + error.message);
    }
  };

  // Handle adding a subject
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert("Error", "Subject name cannot be empty.");
      return;
    }
    try {
      const subjectRef = doc(
        collection(db, "communities", selectedCommunityId, "subjects")
      );
      await setDoc(subjectRef, {
        name: newSubjectName,
        createdAt: new Date(),
      });
      setNewSubjectName("");
      setShowSubjectModal(false);
      Alert.alert("Success", "Subject added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add subject: " + error.message);
    }
  };

  // Handle deleting a community
  const handleDeleteCommunity = async () => {
    if (!user || userType !== "teacher") {
      Alert.alert("Error", "Only teachers can delete communities.");
      return;
    }
    try {
      const batch = writeBatch(db);
      const communityRef = doc(db, "communities", deleteCommunityId);

      // Delete subjects and their subcollections
      const subjectsSnapshot = await getDocs(
        collection(db, "communities", deleteCommunityId, "subjects")
      );
      for (const subjectDoc of subjectsSnapshot.docs) {
        const subjectId = subjectDoc.id;
        // Delete messages
        const messagesSnapshot = await getDocs(
          collection(
            db,
            "communities",
            deleteCommunityId,
            "subjects",
            subjectId,
            "messages"
          )
        );
        messagesSnapshot.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        // Delete members
        const membersSnapshot = await getDocs(
          collection(
            db,
            "communities",
            deleteCommunityId,
            "subjects",
            subjectId,
            "members"
          )
        );
        membersSnapshot.forEach((memberDoc) => {
          batch.delete(memberDoc.ref);
        });
        // Delete subject
        batch.delete(subjectDoc.ref);
      }

      // Delete community members
      const membersSnapshot = await getDocs(
        collection(db, "communities", deleteCommunityId, "members")
      );
      for (const memberDoc of membersSnapshot.docs) {
        const subjectsSnapshot = await getDocs(
          collection(
            db,
            "communities",
            deleteCommunityId,
            "members",
            memberDoc.id,
            "subjects"
          )
        );
        subjectsSnapshot.forEach((subDoc) => {
          batch.delete(subDoc.ref);
        });
        batch.delete(memberDoc.ref);
      }

      // Delete community
      batch.delete(communityRef);

      await batch.commit();
      setShowDeleteCommunityModal(false);
      setDeleteCommunityId(null);
      Alert.alert("Success", "Community deleted successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to delete community: " + error.message);
    }
  };

  // Handle deleting a subject
  const handleDeleteSubject = async () => {
    if (!user || userType !== "teacher") {
      Alert.alert("Error", "Only teachers can delete subjects.");
      return;
    }
    try {
      const batch = writeBatch(db);
      const subjectRef = doc(
        db,
        "communities",
        selectedCommunityId,
        "subjects",
        deleteSubjectId
      );

      // Delete messages
      const messagesSnapshot = await getDocs(
        collection(
          db,
          "communities",
          selectedCommunityId,
          "subjects",
          deleteSubjectId,
          "messages"
        )
      );
      messagesSnapshot.forEach((msgDoc) => {
        batch.delete(msgDoc.ref);
      });

      // Delete members
      const membersSnapshot = await getDocs(
        collection(
          db,
          "communities",
          selectedCommunityId,
          "subjects",
          deleteSubjectId,
          "members"
        )
      );
      membersSnapshot.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
        // Also remove from user's joined subjects
        batch.delete(
          doc(
            db,
            "communities",
            selectedCommunityId,
            "members",
            memberDoc.id,
            "subjects",
            deleteSubjectId
          )
        );
      });

      // Delete subject
      batch.delete(subjectRef);

      await batch.commit();
      if (
        selectedSubject &&
        selectedSubject.communityId === selectedCommunityId &&
        selectedSubject.subjectId === deleteSubjectId
      ) {
        setSelectedSubject(null);
      }
      setShowDeleteSubjectModal(false);
      setDeleteSubjectId(null);
      Alert.alert("Success", "Subject deleted successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to delete subject: " + error.message);
    }
  };

  // Handle posting a message
  const handlePostMessage = async () => {
    if (!user || !selectedSubject || !message.trim()) {
      Alert.alert(
        "Error",
        "Cannot post message. Ensure you are logged in and message is not empty."
      );
      return;
    }
    try {
      await addDoc(
        collection(
          db,
          "communities",
          selectedSubject.communityId,
          "subjects",
          selectedSubject.subjectId,
          "messages"
        ),
        {
          text: message,
          userId: user.uid,
          userEmail: user.email,
          createdAt: new Date(),
        }
      );
      setMessage("");
    } catch (error) {
      Alert.alert("Error", "Failed to post message: " + error.message);
    }
  };

  // Format date for headers
  const formatDateHeader = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Render message or date header
  const renderMessageOrHeader = ({ item, index }) => {
    const date = new Date(item.createdAt.seconds * 1000);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const prevDate = prevMessage
      ? new Date(prevMessage.createdAt.seconds * 1000).toDateString()
      : null;
    const currentDate = date.toDateString();
    const showDateHeader = index === 0 || prevDate !== currentDate;
    const isUser = item.userId === user?.uid;
    const timestamp = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const emailInitial = item.userEmail.charAt(0).toUpperCase();

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
          </View>
        )}
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
          <Animated.View
            style={[
              styles.messageItem,
              isUser ? styles.messageUser : styles.messageOther,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.messageAvatar}>
              <Text style={styles.avatarText}>{emailInitial}</Text>
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.messageEmail}>{item.userEmail}</Text>
              <Text style={styles.messageText}>{item.text}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.messageTimestamp}>{timestamp}</Text>
                {isUser && (
                  <View style={styles.messageStatus}>
                    <Ionicons name="checkmark-done" size={14} color="#999" />
                    <Text style={styles.messageStatusText}>Delivered</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={isUser ? styles.tailUser : styles.tailOther} />
          </Animated.View>
        </Pressable>
      </>
    );
  };

  // Render subject item
  const renderSubject = ({ item, communityId }) => {
    const isJoined = joinedSubjects[communityId]?.includes(item.id);
    return (
      <View style={styles.subjectItemContainer}>
        <TouchableOpacity
          style={styles.subjectItem}
          onPress={() =>
            isJoined
              ? setSelectedSubject({
                  communityId,
                  subjectId: item.id,
                  name: item.name,
                })
              : handleJoinSubject(communityId, item.id)
          }
        >
          <Text style={styles.subjectTitle}>{item.name}</Text>
          <View style={styles.buttonContainer}>
            {isJoined ? (
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            ) : (
              <TouchableOpacity
                onPress={() => handleJoinSubject(communityId, item.id)}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        {userType === "teacher" && (
          <TouchableOpacity
            onPress={() => {
              setSelectedCommunityId(communityId);
              setDeleteSubjectId(item.id);
              setShowDeleteSubjectModal(true);
            }}
            style={styles.deleteSubjectButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render community
  const renderCommunity = ({ item }) => (
    <View style={styles.communityContainer}>
      <View style={styles.communityHeader}>
        <Text style={styles.communityTitle}>{item.name}</Text>
        {userType === "teacher" && (
          <View style={styles.communityActions}>
            <TouchableOpacity
              onPress={() => {
                setSelectedCommunityId(item.id);
                setShowSubjectModal(true);
              }}
              style={styles.addSubjectButton}
            >
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setDeleteCommunityId(item.id);
                setShowDeleteCommunityModal(true);
              }}
              style={styles.deleteCommunityButton}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <FlatList
        data={item.subjects}
        renderItem={({ item: subject }) =>
          renderSubject({ item: subject, communityId: item.id })
        }
        keyExtractor={(subject) => subject.id}
        style={styles.list}
      />
    </View>
  );

  // Render subject view
  const renderSubjectView = () => (
    <Animated.View
      style={[
        styles.subjectView,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSelectedSubject(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedSubject.name}</Text>
        <TouchableOpacity
          onPress={() => setShowMembers(!showMembers)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {showMembers ? "Messages" : `Members(${members.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            handleLeaveSubject(
              selectedSubject.communityId,
              selectedSubject.subjectId
            )
          }
          style={styles.headerLeaveButton}
        >
          <Ionicons name="exit-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      {showMembers ? (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#999" />
              <Text style={styles.emptyStateText}>Start the conversation!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageOrHeader}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.messageList}
            />
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={handlePostMessage}
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!message.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={message.trim() ? "#007AFF" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </Animated.View>
  );

  // Render community modal
  const renderCommunityModal = () => (
    <Modal
      visible={showCommunityModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowCommunityModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Community</Text>
          <TextInput
            style={styles.modalInput}
            value={newCommunityName}
            onChangeText={setNewCommunityName}
            placeholder="Enter community name"
            placeholderTextColor="#999"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowCommunityModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCommunity}
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render subject modal
  const renderSubjectModal = () => (
    <Modal
      visible={showSubjectModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowSubjectModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Subject</Text>
          <TextInput
            style={styles.modalInput}
            value={newSubjectName}
            onChangeText={setNewSubjectName}
            placeholder="Enter subject name"
            placeholderTextColor="#999"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowSubjectModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddSubject}
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render delete community modal
  const renderDeleteCommunityModal = () => (
    <Modal
      visible={showDeleteCommunityModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowDeleteCommunityModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Community</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this community? This action cannot
            be undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowDeleteCommunityModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteCommunity}
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render delete subject modal
  const renderDeleteSubjectModal = () => (
    <Modal
      visible={showDeleteSubjectModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowDeleteSubjectModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Subject</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this subject? This action cannot be
            undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowDeleteSubjectModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteSubject}
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render member item
  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberEmail}>{item.email}</Text>
      <Text style={styles.memberJoined}>
        Joined: {new Date(item.joinedAt.seconds * 1000).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {selectedSubject ? (
        renderSubjectView()
      ) : (
        <>
          <View style={styles.titleContainer}>
            {userType === "teacher" && (
              <TouchableOpacity
                onPress={() => setShowCommunityModal(true)}
                style={styles.addCommunityButton}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={communities}
            renderItem={renderCommunity}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No communities found</Text>
              </View>
            }
          />
          {renderCommunityModal()}
          {renderSubjectModal()}
          {renderDeleteCommunityModal()}
          {renderDeleteSubjectModal()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addCommunityButton: {
    padding: 8,
  },
  communityContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  communityActions: {
    flexDirection: "row",
  },
  addSubjectButton: {
    padding: 8,
  },
  deleteCommunityButton: {
    padding: 8,
  },
  deleteSubjectButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  subjectItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  subjectItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  subjectTitle: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  subjectView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  toggleButton: {
    padding: 8,
  },
  toggleText: {
    fontSize: 16,
    color: "#007AFF",
  },
  headerLeaveButton: {
    padding: 8,
  },
  messageList: {
    padding: 10,
    paddingBottom: 80,
  },
  dateHeader: {
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  messageItem: {
    flexDirection: "row",
    maxWidth: "80%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  messageUser: {
    backgroundColor: "#34C759",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageOther: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ddd",
    borderBottomLeftRadius: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  messageContent: {
    flex: 1,
  },
  messageEmail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#999",
  },
  messageStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageStatusText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 2,
  },
  tailUser: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "#34C759",
    borderLeftWidth: 8,
    borderLeftColor: "transparent",
    position: "absolute",
    bottom: 0,
    right: -8,
  },
  tailOther: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "#fff",
    borderRightWidth: 8,
    borderRightColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: -8,
  },
  memberItem: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 10,
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  memberJoined: {
    fontSize: 12,
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 10,
    fontSize: 15,
    color: "#333",
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalAddButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalAddText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});