import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { submitIssueReport } from '../services/api';
import { speak } from '../services/speechService';

// expo-speech-recognition requires a native dev build.
// We load it lazily so the app never crashes in Expo Go — it just falls back
// to manual text entry when the native module is absent.
let ExpoSpeechRecognitionModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let useSpeechRecognitionEvent: (event: string, handler: (...args: any[]) => void) => void =
  () => {};

try {
  // This throws in Expo Go — caught below so the app stays alive
  const stt = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = stt.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = stt.useSpeechRecognitionEvent;
} catch (_e) {
  // Native module not available — voice features disabled, manual input works fine
}

type RecordingState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'readyToSubmit'
  | 'submitting'
  | 'success'
  | 'error';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportIssue'>;

const sttAvailable = ExpoSpeechRecognitionModule !== null;

export default function ReportIssueScreen({ navigation }: Props) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardHint, setKeyboardHint] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // ── Speech recognition event handlers ──────────────────────────────────────
  // These hooks must be called unconditionally (React rules).
  // If the native module is absent the events simply never fire.

  useSpeechRecognitionEvent('start', () => {
    setRecordingState('listening');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text: string = event?.results?.[0]?.transcript ?? '';
    if (text) setTranscript(text);
    if (event?.isFinal) {
      setRecordingState('readyToSubmit');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setRecordingState((prev) => {
      if (prev === 'listening' || prev === 'processing') return 'readyToSubmit';
      return prev;
    });
  });

  useSpeechRecognitionEvent('error', (event) => {
    const msg: string =
      (event as any)?.message || 'Voice recognition failed. Please type your issue below.';
    setErrorMsg(msg);
    setRecordingState('error');
    speak('Voice recognition failed. Please type your issue below.');
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      // Open the keyboard so the user can tap the iOS dictation mic key
      setKeyboardHint(true);
      textInputRef.current?.focus();
      speak('Tap the microphone key on your keyboard to speak.');
      return;
    }
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setErrorMsg('Microphone permission denied. Please type your issue below.');
        setRecordingState('error');
        speak('Microphone permission denied.');
        return;
      }
      setTranscript('');
      setErrorMsg('');
      setRecordingState('listening');
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1
      });
      speak('Listening. Describe the accessibility issue now.');
    } catch {
      setErrorMsg('Voice input is not available. Please type your issue below.');
      setRecordingState('error');
    }
  }, []);

  const stopListening = useCallback(() => {
    setRecordingState('processing');
    try {
      ExpoSpeechRecognitionModule?.stop();
    } catch {
      // ignore
    }
    setRecordingState('readyToSubmit');
  }, []);

  const handleMicPress = useCallback(() => {
    if (recordingState === 'listening') {
      stopListening();
    } else if (recordingState === 'idle' || recordingState === 'error') {
      startListening();
    }
  }, [recordingState, startListening, stopListening]);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim()) {
      speak('Please describe your issue before submitting.');
      return;
    }
    setRecordingState('submitting');
    setErrorMsg('');
    try {
      await submitIssueReport(transcript.trim());
      setRecordingState('success');
      speak('Your report has been submitted. Thank you for helping improve accessibility.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Submission failed. Please try again.';
      setErrorMsg(msg);
      setRecordingState('error');
      speak('Submission failed. Please try again.');
    }
  }, [transcript]);

  const handleReset = useCallback(() => {
    setRecordingState('idle');
    setTranscript('');
    setErrorMsg('');
  }, []);

  // ── Derived display values ──────────────────────────────────────────────────

  const micColor = (() => {
    switch (recordingState) {
      case 'listening':   return '#ef4444';
      case 'processing':
      case 'submitting':  return '#4b5563';
      case 'success':     return '#22c55e';
      case 'error':       return '#f59e0b';
      default:            return '#60a5fa';
    }
  })();

  const statusText = (() => {
    switch (recordingState) {
      case 'idle':          return 'Tap the microphone to report an issue by voice';
      case 'listening':     return 'Listening… tap the button to stop';
      case 'processing':    return 'Processing your speech…';
      case 'readyToSubmit': return 'Review your report and tap Submit';
      case 'submitting':    return 'Submitting your report…';
      case 'success':       return 'Report submitted successfully!';
      case 'error':         return errorMsg || 'Something went wrong';
    }
  })();

  const micLabel = (() => {
    switch (recordingState) {
      case 'listening':  return 'STOP';
      case 'processing':
      case 'submitting': return '…';
      default:           return 'MIC';
    }
  })();

  const micDisabled =
    recordingState === 'processing' ||
    recordingState === 'submitting' ||
    recordingState === 'success';

  const canSubmit =
    transcript.trim().length > 0 &&
    recordingState !== 'submitting' &&
    recordingState !== 'success';

  const inputEditable =
    recordingState !== 'submitting' && recordingState !== 'success';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Status */}
      <View style={styles.statusArea}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Microphone button — always visible */}
      <TouchableOpacity
        style={[styles.micButton, { backgroundColor: micColor }, micDisabled && styles.micDisabled]}
        onPress={handleMicPress}
        disabled={micDisabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={recordingState === 'listening' ? 'Stop recording' : 'Start voice recording'}
      >
        {recordingState === 'processing' || recordingState === 'submitting' ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={styles.micLabel}>{micLabel}</Text>
        )}
      </TouchableOpacity>

      {/* Keyboard dictation hint — appears after mic tap in Expo Go */}
      {keyboardHint && !sttAvailable && recordingState !== 'success' && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>
            Keyboard is open — tap <Text style={styles.hintHighlight}>🎤</Text> next to the space bar to speak
          </Text>
        </View>
      )}

      {/* Transcript / manual input — hidden on success */}
      {recordingState !== 'success' && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {transcript.trim() ? 'Your report (edit if needed):' : 'Describe your issue here:'}
          </Text>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, inputFocused && styles.textInputFocused]}
            multiline
            value={transcript}
            onChangeText={(text) => {
              setTranscript(text);
              if (keyboardHint && text.trim()) setKeyboardHint(false);
              if (
                recordingState !== 'listening' &&
                recordingState !== 'processing' &&
                recordingState !== 'submitting'
              ) {
                setRecordingState(text.trim() ? 'readyToSubmit' : 'idle');
              }
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Tap the mic button above, then speak using the keyboard 🎤"
            placeholderTextColor="#475569"
            accessible
            accessibilityLabel="Issue description"
            accessibilityHint="Type or dictate the accessibility issue"
            editable={inputEditable}
          />
        </View>
      )}

      {/* Submit */}
      {canSubmit && (
        <TouchableOpacity
          style={[styles.submitButton, recordingState === 'submitting' && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={recordingState === 'submitting'}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Submit report"
        >
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      )}

      {/* Success state */}
      {recordingState === 'success' && (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successBody}>
            Thank you. Your accessibility report has been received and will be reviewed.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.anotherButton}
            onPress={handleReset}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Report another issue"
          >
            <Text style={styles.anotherText}>Report Another Issue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retry after error with no transcript typed */}
      {recordingState === 'error' && !transcript.trim() && (
        <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0b1220'
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20
  },
  statusArea: {
    marginBottom: 36,
    paddingHorizontal: 8
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  micDisabled: {
    opacity: 0.5
  },
  micLabel: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1
  },
  hintBanner: {
    backgroundColor: '#1e3a5f',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  hintText: {
    color: '#93c5fd',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  hintHighlight: {
    color: '#ffffff',
    fontWeight: '700'
  },
  inputSection: {
    width: '100%',
    marginBottom: 20
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    fontSize: 18,
    lineHeight: 26,
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155'
  },
  textInputFocused: {
    borderColor: '#60a5fa',
    borderWidth: 2
  },
  submitButton: {
    backgroundColor: '#60a5fa',
    borderRadius: 12,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginTop: 4
  },
  buttonDisabled: {
    opacity: 0.5
  },
  submitText: {
    color: '#0b1220',
    fontSize: 20,
    fontWeight: '700'
  },
  successBox: {
    alignItems: 'center',
    marginTop: 24,
    width: '100%'
  },
  successTitle: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12
  },
  successBody: {
    color: '#cbd5e1',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32
  },
  doneButton: {
    backgroundColor: '#60a5fa',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  doneText: {
    color: '#0b1220',
    fontSize: 20,
    fontWeight: '700'
  },
  anotherButton: {
    paddingVertical: 12
  },
  anotherText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600'
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12
  },
  retryText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600'
  }
});
