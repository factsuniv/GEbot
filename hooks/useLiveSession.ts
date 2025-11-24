import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AdminConfig, TranscriptionItem } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';

export const useLiveSession = (config: AdminConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [volume, setVolume] = useState(0); // For visualization
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts and Processing
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Audio Queue Management
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Visualization Loop
  const rafIdRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    // Stop audio contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop script processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Stop sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // Close session if possible (wrapper logic mostly)
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
            try { session.close(); } catch(e) { console.warn("Failed to close session", e)}
        }).catch(() => {});
        sessionPromiseRef.current = null;
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const updateVisualizer = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setVolume(average / 255.0); // Normalize 0-1
    }
    rafIdRef.current = requestAnimationFrame(updateVisualizer);
  };

  const connect = useCallback(async () => {
    setError(null);
    try {
      // 1. Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Resume contexts immediately (crucial for some browsers to allow audio playback)
      await inputCtx.resume();
      await outputCtx.resume();

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      // Setup Analyser for visualization (attached to output)
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(outputCtx.destination);
      analyserRef.current = analyser;

      // 2. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Initialize GenAI Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
          },
          systemInstruction: config.systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setIsConnected(true);
            
            // Start Microphone Streaming
            const source = inputCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            
            // Lower buffer size (2048) reduces latency compared to 4096
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            // Start Visualizer
            rafIdRef.current = requestAnimationFrame(updateVisualizer);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcripts
            if (msg.serverContent?.outputTranscription) {
               currentOutputTranscriptionRef.current += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.inputTranscription) {
               currentInputTranscriptionRef.current += msg.serverContent.inputTranscription.text;
            }
            
            if (msg.serverContent?.turnComplete) {
                const userText = currentInputTranscriptionRef.current;
                const modelText = currentOutputTranscriptionRef.current;
                
                if (userText || modelText) {
                    setTranscripts(prev => [
                        ...prev,
                        { text: userText, sender: 'user', timestamp: Date.now() },
                        { text: modelText, sender: 'model', timestamp: Date.now() }
                    ].filter(t => t.text.trim() !== ''));
                }
                
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }

            // Handle Audio
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              if (outputCtx.state === 'suspended') {
                  await outputCtx.resume();
              }
              
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime
              );

              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(audioData),
                outputCtx,
                24000
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyser); // Connect to analyser first, which is connected to destination
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
              setIsSpeaking(true);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => {
                  try { src.stop(); } catch (e) {}
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log('Session closed');
            cleanup();
          },
          onerror: (err) => {
            console.error('Session error', err);
            setError("Connection error detected.");
            cleanup();
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
      cleanup();
    }
  }, [cleanup, config]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    }
  }, [cleanup]);

  return {
    connect,
    disconnect,
    isConnected,
    isSpeaking,
    volume,
    transcripts,
    error
  };
};