import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VoiceNotes.css';

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState('00:00');
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
    }

    // Test microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('Microphone access granted');
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(err => {
          setError('Microphone access is required. Please allow microphone access and refresh.');
        });
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let newFinalTranscript = finalTranscript;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          newFinalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      setFinalTranscript(newFinalTranscript);
      setTranscript(newFinalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else if (event.error !== 'no-speech') {
        setError(`Recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition restart failed:', e);
        }
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [finalTranscript, isRecording]);

  // FIXED TIMER FUNCTIONS
  const startTimer = useCallback(() => {
    const recordingStartTime = Date.now(); // Capture start time locally
    setStartTime(recordingStartTime); // Update state for other uses
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartTime; // Use local variable
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const displaySeconds = seconds % 60;
      
      setTimer(`${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`);
    }, 1000);
  }, []); // Remove startTime dependency

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    try {
      if (!recognitionRef.current) {
        initSpeechRecognition();
      }
      
      setFinalTranscript('');
      setTranscript('');
      recognitionRef.current.start();
      
      setIsRecording(true);
      setStatus('recording');
      setError('');
      
      startTimer(); // This now works correctly
    } catch (error) {
      setError('Failed to start recording. Please refresh and try again.');
      console.error('Start recording error:', error);
    }
  }, [initSpeechRecognition, startTimer]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
    setStatus('processing');
    stopTimer();
    
    setTimeout(() => {
      setStatus('ready');
    }, 1000);
  }, [stopTimer]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscript = () => {
    setFinalTranscript('');
    setTranscript('');
    setTimer('00:00');
  };

  const downloadTranscript = () => {
    if (!finalTranscript.trim()) return;
    
    const blob = new Blob([finalTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getButtonContent = () => {
    switch(status) {
      case 'recording': return '⏹️';
      case 'processing': return '⏳';
      default: return '🎤';
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'recording': return 'Recording... Click to stop';
      case 'processing': return 'Processing...';
      default: return 'Click to start recording';
    }
  };

  return (
    <div className="voice-notes-container">
      <div className="voice-notes-card">
        <div className="logo">🎤 Voice Notes</div>
        <div className="tagline">AI-Powered Meeting Analysis</div>

        {!browserSupported && (
          <div className="browser-support">
            <strong>Browser Support:</strong> This works best in Chrome, Safari, or Edge. Make sure to allow microphone access when prompted.
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="recording-section">
          <button
            onClick={toggleRecording}
            disabled={!browserSupported}
            className={`record-button ${status}`}
          >
            {getButtonContent()}
          </button>
          
          <div className={`status ${status}`}>
            {getStatusText()}
          </div>
          
          <div className="timer">
            {timer}
          </div>
          
          <div className="controls">
            <button
              onClick={clearTranscript}
              disabled={!finalTranscript.trim()}
              className="btn"
            >
              🗑️ Clear
            </button>
            <button
              onClick={downloadTranscript}
              disabled={!finalTranscript.trim()}
              className="btn"
            >
              💾 Download
            </button>
          </div>
        </div>

        <div className="transcript-section">
          <div className="transcript-title">Live Transcript</div>
          <div className={`transcript-box ${!transcript.trim() ? 'empty' : ''}`}>
            {transcript.trim() || 'Transcript will appear here as you speak...'}
          </div>
          <div className="speaker-info">
            <strong>Tip:</strong> Speak clearly and pause between speakers for better accuracy. We'll add speaker identification in the next version!
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceNotes;