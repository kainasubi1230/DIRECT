import { GameState, PlayerId } from '@/types/game';

export type PeerMessageType =
  | { type: 'STATE_SYNC'; state: GameState }
  | { type: 'MOVE_ACTION'; action: any }
  | { type: 'CHAT_MESSAGE'; text: string; sender: string }
  | { type: 'PLAYER_JOINED'; role: PlayerId }
  | { type: 'RESTART_GAME' };

export class PeerManager {
  private peer: any = null;
  private conn: any = null;
  private onStateSyncCallback?: (state: GameState) => void;
  private onStatusChangeCallback?: (status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR', message?: string) => void;
  private onChatCallback?: (msg: { text: string; sender: string }) => void;
  private isHost: boolean = false;
  private roomCode: string = '';

  constructor() {}

  public async initHost(roomCode: string, onStateSync: (state: GameState) => void, onStatusChange: (status: any, msg?: string) => void, onChat?: any) {
    this.roomCode = roomCode;
    this.isHost = true;
    this.onStateSyncCallback = onStateSync;
    this.onStatusChangeCallback = onStatusChange;
    this.onChatCallback = onChat;

    const PeerModule = (await import('peerjs')).default;
    const peerId = `direct-game-${roomCode}`;

    this.onStatusChangeCallback?.('CONNECTING', 'ルームを作成中...');

    this.peer = new PeerModule(peerId, {
      debug: 1,
    });

    this.peer.on('open', (id: string) => {
      console.log('Host Peer opened with ID:', id);
      this.onStatusChangeCallback?.('CONNECTING', '対戦相手の接続を待機しています...');
    });

    this.peer.on('connection', (connection: any) => {
      console.log('Guest connected to host!');
      this.conn = connection;
      this.setupConnectionHandlers();
      this.onStatusChangeCallback?.('CONNECTED', '対戦相手が接続しました！対戦を開始します...');
    });

    this.peer.on('error', (err: any) => {
      console.error('Peer host error:', err);
      this.onStatusChangeCallback?.('ERROR', `接続エラー: ${err.message || 'ルーム作成失敗'}`);
    });
  }

  public async initGuest(roomCode: string, onStateSync: (state: GameState) => void, onStatusChange: (status: any, msg?: string) => void, onChat?: any) {
    this.roomCode = roomCode;
    this.isHost = false;
    this.onStateSyncCallback = onStateSync;
    this.onStatusChangeCallback = onStatusChange;
    this.onChatCallback = onChat;

    const PeerModule = (await import('peerjs')).default;
    const hostPeerId = `direct-game-${roomCode}`;

    this.onStatusChangeCallback?.('CONNECTING', 'ホストに接続中...');

    this.peer = new PeerModule({
      debug: 1,
    });

    this.peer.on('open', () => {
      this.conn = this.peer.connect(hostPeerId);
      this.setupConnectionHandlers();
    });

    this.peer.on('error', (err: any) => {
      console.error('Peer guest error:', err);
      this.onStatusChangeCallback?.('ERROR', `ルームへの接続に失敗しました: ${err.message || 'ルームが見つかりません'}`);
    });
  }

  private setupConnectionHandlers() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.onStatusChangeCallback?.('CONNECTED', '接続完了！対戦画面に移行します...');
    });

    this.conn.on('data', (data: PeerMessageType) => {
      if (data.type === 'STATE_SYNC') {
        this.onStateSyncCallback?.(data.state);
      } else if (data.type === 'CHAT_MESSAGE') {
        this.onChatCallback?.({ text: data.text, sender: data.sender });
      }
    });

    this.conn.on('close', () => {
      this.onStatusChangeCallback?.('DISCONNECTED', '対戦相手との接続が切断されました');
    });

    this.conn.on('error', (err: any) => {
      this.onStatusChangeCallback?.('ERROR', `通信エラー: ${err.message}`);
    });
  }

  public sendStateSync(state: GameState) {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'STATE_SYNC', state });
    }
  }

  public sendChatMessage(text: string, sender: string) {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'CHAT_MESSAGE', text, sender });
    }
  }

  public disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.onStatusChangeCallback?.('DISCONNECTED');
  }

  public getIsHost(): boolean {
    return this.isHost;
  }
}

export const peerManager = new PeerManager();
