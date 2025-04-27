import React, { createContext, useContext, useState, useCallback } from 'react';
import { Audio } from 'expo-av';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [sound, setSound] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [allTracks, setAllTracks] = useState([]); // Unified track list

  const playTrack = useCallback(async (track, resume = false) => {
    try {
      if (sound && !resume) {
        await sound.pauseAsync();
        await sound.unloadAsync();
      }
      const { sound: newSound } = resume && sound
        ? { sound }
        : await Audio.Sound.createAsync(
            { uri: track.uri || track.audio },
            { shouldPlay: true, progressUpdateIntervalMillis: 500 }
          );
      setSound(newSound);
      setPlayingTrackId(track.id);
      setIsPlaying(true);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
          setProgress(status.positionMillis / (status.durationMillis || 1));
        }
      });
    } catch (error) {
      console.error('Error in playTrack:', error);
    }
  }, [sound]);

  const pauseTrack = useCallback(async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [sound]);

  const handleSeek = useCallback(async (value) => {
    if (sound && duration) {
      const newPosition = value * duration;
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
      setProgress(value);
    }
  }, [sound, duration]);

  // Function to add tracks to the unified list
  const addTracks = useCallback((newTracks) => {
    setAllTracks((prevTracks) => {
      const uniqueTracks = newTracks.filter(
        (newTrack) => !prevTracks.some((track) => track.id === newTrack.id)
      );
      return [...prevTracks, ...uniqueTracks];
    });
  }, []);

  return (
    <PlayerContext.Provider value={{
      playingTrackId,
      progress,
      duration,
      position,
      isPlaying,
      playTrack,
      pauseTrack,
      handleSeek,
      setPlayingTrackId,
      allTracks,
      addTracks,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);