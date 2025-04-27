import { db } from '../firebase'; // Adjust path to your firebaseConfig.js
import { collection, getDocs } from 'firebase/firestore';

// Function to fetch tracks from Firestore
export const fetchTracks = async () => {
  try {
    const tracksCollection = collection(db, 'tracks');
    const tracksSnapshot = await getDocs(tracksCollection);
    const tracksArray = tracksSnapshot.docs.map((doc) => ({
      id: doc.id, // Use Firestore document ID as the track id
      ...doc.data(), // Spread title, artist, audio, image
    }));
    console.log('Retrieved tracks:', tracksArray);
    return tracksArray;
  } catch (error) {
    console.error('Error fetching tracks from Firestore:', error);
    return []; // Return empty array as fallback
  }
};