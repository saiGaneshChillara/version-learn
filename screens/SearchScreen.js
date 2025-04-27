import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { tracks as importedTracks } from '../data/tracks';
import TrackItem from '../components/TrackItem1'; // Use same TrackItem as HomeScreen
import PlayerControls from '../components/PlayerControls';
import TrackModal from '../components/TrackModal';
import { usePlayer } from './PlayerContext';
import { Ionicons } from '@expo/vector-icons';

const tracks = importedTracks || [];

export default function SearchScreen() {
  const {
    playingTrackId,
    progress,
    duration,
    position,
    isPlaying,
    playTrack,
    pauseTrack,
    handleSeek,
    allTracks,
    addTracks,
  } = usePlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    addTracks(tracks); // Add tracks to shared context on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [addTracks, fadeAnim]);

  const filteredTracks = allTracks.filter(
    (track) =>
      (track?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (track?.artist?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleNextTrack = async () => {
    if (!playingTrackId) return;
    const currentIndex = allTracks.findIndex((t) => t.id === playingTrackId);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    await playTrack(allTracks[nextIndex]);
  };

  const handlePreviousTrack = async () => {
    if (!playingTrackId) return;
    const currentIndex = allTracks.findIndex((t) => t.id === playingTrackId);
    const prevIndex = currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
    await playTrack(allTracks[prevIndex]);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  const currentTrack = allTracks.find((t) => t.id === playingTrackId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs or artists..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search for songs or artists"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TrackItem
            track={item}
            isPlaying={playingTrackId === item.id && isPlaying}
            onPlay={() => playTrack(item)}
            onPause={pauseTrack}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'Start typing to search'}
          </Text>
        }
      />
      {playingTrackId && (
        <View style={styles.statusBar}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.textContainer}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.trackTitle}>{currentTrack?.title || currentTrack?.name}</Text>
              <Text style={styles.statusText}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </TouchableOpacity>
            <PlayerControls
              isPlaying={isPlaying}
              onPrevious={handlePreviousTrack}
              onPlayPause={togglePlayPause}
              onNext={handleNextTrack}
            />
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={progress}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#1DB954"
          />
        </View>
      )}
      <TrackModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        track={currentTrack}
        position={position}
        duration={duration}
        progress={progress}
        onSeek={handleSeek}
        isPlaying={isPlaying}
        onPrevious={handlePreviousTrack}
        onPlayPause={togglePlayPause}
        onNext={handleNextTrack}
        formatTime={formatTime}
      />
    </View>
  );
}

function formatTime(millis) {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  listContent: {
    padding: 10,
    paddingBottom: 90, // Space for status bar
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  slider: {
    width: '100%',
    height: 20,
    paddingHorizontal: 5,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});