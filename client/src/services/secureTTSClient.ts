/**
 * Sichere TTS-Client Implementation
 * Verwendet Server-API anstatt direkter ElevenLabs-Integration
 * Keine API-Keys im Browser!
 */

export type NavigationType = 'direction' | 'warning' | 'arrival' | 'start';

interface TTSResponse {
  available: boolean;
  connected?: boolean;
  message?: string;
  error?: string;
}

// Added type for voice object based on expected API response
interface Voice {
  id: string;
  name: string;
  // Add other properties if known
}

export class SecureTTSClient {
  private audioContext: AudioContext | null = null;
  private audioCache = new Map<string, ArrayBuffer>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 Stunde
  private readonly MAX_CACHE_SIZE = 50;
  private playbackQueue: Promise<void> = Promise.resolve();
  private currentVoiceId: string = '';

  constructor() {
    console.log('🎤 Secure TTS Client initialisiert - Keine API-Keys im Browser');
  }

  /**
   * Initialisiert Audio-Context (lazy loading)
   */
  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 Audio-Context initialisiert');
    }

    // Resume context if suspended (browser policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('▶️ Audio-Context resumed');
    }

    return this.audioContext;
  }

  /**
   * Generiert TTS über sichere Server-API
   * @param text Deutscher Navigation-Text
   * @param type Art der Navigation-Ansage
   */
  async generateTTS(text: string, type: NavigationType = 'direction'): Promise<ArrayBuffer> {
    try {
      console.log('🌐 Secure TTS Request:', { text: text.slice(0, 50) + '...', type });

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, type })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('✅ TTS generiert - Größe:', Math.round(audioBuffer.byteLength / 1024), 'KB');

      return audioBuffer;
    } catch (error) {
      console.error('❌ Secure TTS Generation Error:', error);
      throw error;
    }
  }

  /**
   * Spielt Audio-Buffer ab (mit Queue für overlap-prevention)
   * @param audioBuffer MP3-Audio-Daten
   */
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    // Zur Playback-Queue hinzufügen
    this.playbackQueue = this.playbackQueue.then(async () => {
      try {
        const audioContext = await this.initAudioContext();

        // MP3 dekodieren
        const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));

        // Audio-Source erstellen und abspielen
        const source = audioContext.createBufferSource();
        source.buffer = decodedAudio;
        source.connect(audioContext.destination);
        source.start();

        console.log('🔊 Sichere Audio-Wiedergabe - Dauer:', decodedAudio.duration.toFixed(1), 's');

        // Promise für Wiedergabe-Ende
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Audio-Wiedergabe Timeout');
            reject(new Error('Audio playback timeout'));
          }, Math.max(10000, decodedAudio.duration * 1000 + 2000));

          source.onended = () => {
            clearTimeout(timeout);
            console.log('✅ Audio-Wiedergabe beendet');
            resolve();
          };
        });
      } catch (error) {
        console.error('❌ Audio-Wiedergabe Fehler:', error);
        throw error;
      }
    });

    return this.playbackQueue;
  }

  /**
   * Hauptmethode: Sichere deutsche TTS mit Caching
   * @param text Navigation-Text
   * @param type Art der Ansage
   */
  async speak(text: string, type: NavigationType = 'direction'): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(text, type);

      // Cache-Check
      let audioBuffer = this.audioCache.get(cacheKey);

      if (!audioBuffer) {
        console.log('🌐 Cache Miss - Generiere TTS:', text.slice(0, 30) + '...');
        audioBuffer = await this.generateTTS(text, type);
        this.addToCache(cacheKey, audioBuffer);
      } else {
        console.log('⚡ Cache Hit - Sofortige Wiedergabe');
      }

      await this.playAudio(audioBuffer);
      console.log('✅ Sichere TTS-Wiedergabe abgeschlossen');
    } catch (error) {
      console.error('❌ Secure TTS Error:', error);
      throw error;
    }
  }

  /**
   * Test der TTS-Verbindung
   */
  async testConnection(): Promise<TTSResponse> {
    try {
      const response = await fetch('/api/tts/test');
      const data: TTSResponse = await response.json();

      console.log('🧪 TTS Connection Test:', data);
      return data;
    } catch (error) {
      console.error('❌ TTS Connection Test Error:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cache-Management
   */
  private getCacheKey(text: string, type: NavigationType): string {
    return btoa(unescape(encodeURIComponent(`${type}:${text}`))).slice(0, 20);
  }

  private addToCache(key: string, audioBuffer: ArrayBuffer): void {
    // Cache-Größe begrenzen
    if (this.audioCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      this.audioCache.delete(oldestKey);
    }

    this.audioCache.set(key, audioBuffer);
    console.log('💾 TTS Cache - Größe:', this.audioCache.size);
  }

  /**
   * Cache-Statistiken für Debugging
   */
  getCacheStats(): { size: number; totalSizeKB: number } {
    let totalBytes = 0;
    for (const audioBuffer of Array.from(this.audioCache.values())) {
      totalBytes += audioBuffer.byteLength;
    }

    return {
      size: this.audioCache.size,
      totalSizeKB: Math.round(totalBytes / 1024)
    };
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.audioCache.clear();
    console.log('🗑️ TTS-Cache geleert');
  }

  /**
   * Deutsche Stimmen abrufen - nur George und Lily
   */
  async getGermanVoices(): Promise<Voice[]> {
    try {
      const response = await fetch('/api/tts/voices/german');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deutsche Stimmen konnten nicht abgerufen werden');
      }

      const data = await response.json();
      let voices = data.voices || [];

      // Client-seitige Filterung für nur George und Lily
      voices = voices.filter((voice: any) => {
        const name = (voice.name || '').toLowerCase();
        return name.includes('george') || name.includes('lily');
      });

      console.log('🎤 George & Lily Stimmen von API erhalten:', voices.length);
      console.log('🔍 Verfügbare Stimmen:', voices.map((v: any) => v.name));
      return voices;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen deutscher Stimmen:', error);
      throw error;
    }
  }

  /**
   * Stimme wechseln
   */
  async setVoice(voiceId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/tts/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voiceId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stimmenwechsel fehlgeschlagen');
      }

      const data = await response.json();
      this.currentVoiceId = data.currentVoice;

      // Cache leeren bei Stimmenwechsel
      this.clearCache();
      console.log('🎤 Stimme gewechselt und Cache geleert:', voiceId);

      return true;
    } catch (error) {
      console.error('❌ Stimmenwechsel-Fehler:', error);
      throw error;
    }
  }

  /**
   * Aktuelle Stimmen-ID abrufen
   */
  getCurrentVoiceId(): string {
    return this.currentVoiceId;
  }

  /**
   * Cleanup (bei Component unmount)
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      console.log('🧹 Audio-Context cleanup');
    }
    this.clearCache();
  }
}