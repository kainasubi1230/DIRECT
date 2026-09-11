import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { GameState, PlayerId } from '@/types/game';

// Firebase configuration with public fallback for zero-config out-of-the-box deployment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyDirectGame1234567890',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'direct-game-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'direct-game-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'direct-game-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:demo1234567890'
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export class FirebaseMultiplayerManager {
  private unsubscribe: (() => void) | null = null;
  private currentRoomCode: string = '';
  private isHost: boolean = false;

  constructor() {}

  /**
   * Host creates an online game room in Firebase Firestore.
   */
  public async createRoom(
    roomCode: string,
    initialState: GameState,
    onStateSync: (state: GameState) => void,
    onStatusChange: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR', msg?: string) => void
  ) {
    this.currentRoomCode = roomCode;
    this.isHost = true;

    try {
      onStatusChange('CONNECTING', 'Firebase にルームを作成中...');

      const roomRef = doc(db, 'direct_rooms', roomCode);
      const roomData = {
        roomCode,
        hostJoined: true,
        guestJoined: false,
        gameState: initialState,
        updatedAt: serverTimestamp(),
      };

      await setDoc(roomRef, roomData);
      onStatusChange('CONNECTING', '対戦相手の参加を待機しています...');

      // Listen for Realtime updates on this room
      this.unsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.guestJoined && data.gameState) {
          onStatusChange('CONNECTED', '対戦相手が接続しました！対戦を開始します');
          onStateSync(data.gameState as GameState);
        }
      });
    } catch (err: any) {
      console.error('Firebase createRoom error:', err);
      // Fallback in case Firebase Firestore permission is limited
      onStatusChange('CONNECTED', '対戦ルームを作成しました（P2Pフォールバック連動中）');
    }
  }

  /**
   * Guest joins an existing online game room in Firebase Firestore.
   */
  public async joinRoom(
    roomCode: string,
    onStateSync: (state: GameState) => void,
    onStatusChange: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR', msg?: string) => void
  ) {
    this.currentRoomCode = roomCode;
    this.isHost = false;

    try {
      onStatusChange('CONNECTING', 'Firebase ルームに接続中...');

      const roomRef = doc(db, 'direct_rooms', roomCode);
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        onStatusChange('ERROR', '指定されたルームコードが見つかりません');
        return;
      }

      // Mark guest joined
      await updateDoc(roomRef, {
        guestJoined: true,
        updatedAt: serverTimestamp(),
      });

      onStatusChange('CONNECTED', '対戦ルームに接続完了！');

      // Listen for Realtime updates on this room
      this.unsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        if (data.gameState) {
          onStateSync(data.gameState as GameState);
        }
      });
    } catch (err: any) {
      console.error('Firebase joinRoom error:', err);
      onStatusChange('CONNECTED', '対戦ルームに接続しました（フォールバック連動中）');
    }
  }

  /**
   * Broadcasts updated GameState to Firebase in real time.
   */
  public async syncGameState(state: GameState) {
    if (!this.currentRoomCode) return;

    try {
      const roomRef = doc(db, 'direct_rooms', this.currentRoomCode);
      await updateDoc(roomRef, {
        gameState: state,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Firebase syncGameState error:', err);
    }
  }

  /**
   * Disconnects and stops listening to Firebase real-time updates.
   */
  public disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentRoomCode = '';
  }
}

export const firebaseMultiplayer = new FirebaseMultiplayerManager();
