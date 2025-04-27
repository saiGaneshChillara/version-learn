import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import * as MediaLibrary from 'expo-media-library';
import TrackItem from '../components/TrackItem1';
import PlayerControls from '../components/PlayerControls';
import TrackModal from '../components/TrackModal';
import { usePlayer } from './PlayerContext';

// Single fallback music icon
const FALLBACK_MUSIC_ICON = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWMlMjBub3Rlc3xlbnwwfHwwfHx8MA%3D%3D'; // Music notes icon

export default function LibraryScreen() {
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
  
  const [modalVisible, setModalVisible] = useState(false);
  const [localTracks, setLocalTracks] = useState([]);

  useEffect(() => {
    async function loadMedia() {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Please allow access to media library.');
        return;
      }
      const media = await MediaLibrary.getAssetsAsync({ 
        mediaType: 'audio', 
        first: 50 
      });
      const audioFiles = media.assets.map((asset) => ({
        id: asset.id,
        title: asset.filename,
        uri: asset.uri,
        image: FALLBACK_MUSIC_ICON, 
      }));
      setLocalTracks(audioFiles);
      addTracks(audioFiles); 
    }
    loadMedia();
  }, [addTracks]);

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

  const currentTrack = allTracks.find((t) => t.id === playingTrackId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Audio</Text>
      </View>
      <FlatList
        data={localTracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackItem
            track={item}
            isPlaying={playingTrackId === item.id && isPlaying}
            onPlay={() => playTrack(item)}
            onPause={pauseTrack}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No tracks found in your library</Text>}
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
              onPlayPause={isPlaying ? pauseTrack : () => playTrack(currentTrack, true)}
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
        onPlayPause={isPlaying ? pauseTrack : () => playTrack(currentTrack, true)}
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
  listContent: {
    padding: 10,
    paddingBottom: 90,
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