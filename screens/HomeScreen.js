import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackItem from '../components/TrackItem';
import PlayerControls from '../components/PlayerControls';
import TrackModal from '../components/TrackModal';
import { fetchTracks } from '../data/tracks';
import { usePlayer } from './PlayerContext';

export default function HomeScreen({ runningMode }) {
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
  const [isRunning, setIsRunning] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [travelMode, setTravelMode] = useState(false);
  const [travelTrackIds, setTravelTrackIds] = useState([]);
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const STOP_DELAY = 5000;

  useEffect(() => {
    const loadTravelTracks = async () => {
      try {
        const stored = await AsyncStorage.getItem('travelTrackIds');
        if (stored) {
          setTravelTrackIds(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading travel tracks:', error);
      }
    };
    loadTravelTracks();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tracksArray = await fetchTracks();
        addTracks(tracksArray);
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    subscribeToAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
        setSubscription(null);
      }
    };
  }, [addTracks]);

  const subscribeToAccelerometer = () => {
    setSubscription(
      Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const runningDetected = acceleration > 1.5;
        setIsRunning(runningDetected);
        if (runningDetected) {
          setLastMovementTime(Date.now());
        }
      })
    );
    Accelerometer.setUpdateInterval(200);
  };

  useEffect(() => {
    if (runningMode && isRunning && !isPlaying) {
      playTrack(currentTrack || allTracks[0], true);
    }
  }, [runningMode, isRunning, isPlaying, playTrack, currentTrack, allTracks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (runningMode && isPlaying && Date.now() - lastMovementTime > STOP_DELAY) {
        pauseTrack();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [runningMode, isPlaying, lastMovementTime, pauseTrack]);

  useEffect(() => {
    if (isPlaying && position >= duration && duration > 0) {
      handleNextTrack();
    }
  }, [position, duration, isPlaying]);

  const sortedTracks = travelMode
    ? [...allTracks].sort((a, b) => {
        const aIsTravel = travelTrackIds.includes(a.id);
        const bIsTravel = travelTrackIds.includes(b.id);
        if (aIsTravel && !bIsTravel) return -1;
        if (!aIsTravel && bIsTravel) return 1;
        return 0;
      })
    : allTracks;

  const handleTravelTag = async (trackId) => {
    try {
      const newTravelTrackIds = travelTrackIds.includes(trackId)
        ? travelTrackIds.filter((id) => id !== trackId)
        : [...travelTrackIds, trackId];
      setTravelTrackIds(newTravelTrackIds);
      await AsyncStorage.setItem('travelTrackIds', JSON.stringify(newTravelTrackIds));
    } catch (error) {
      console.error('Error saving travel track:', error);
    }
  };

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

  const handleTrackPlay = (track) => {
    playTrack(track);
  };

  const currentTrack = allTracks.find((t) => t.id === playingTrackId);

  const LoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading Tracks...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingComponent />
      ) : (
        <>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Music Player</Text>
            <View style={styles.modeToggle}>
              <Text style={styles.toggleLabel}>Travel Mode</Text>
              <Switch
                onValueChange={setTravelMode}
                value={travelMode}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor={travelMode ? '#fff' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </View>
          <FlatList
            data={sortedTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TrackItem
                track={item}
                isPlaying={playingTrackId === item.id && isPlaying}
                onPlay={() => handleTrackPlay(item)}
                onPause={pauseTrack}
                onTravelTag={() => handleTravelTag(item.id)}
                isTravelTagged={travelTrackIds.includes(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
          {playingTrackId && (
            <View style={styles.statusBar}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.textContainer}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.trackTitle}>
                    {currentTrack?.name || currentTrack?.title}
                  </Text>
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
        </>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  toggleSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  listContent: {
    padding: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});