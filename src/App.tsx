/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { Camera, Send, Volume2 } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Russian');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg').split(',')[1];
      setImage(data);
      setIsCameraActive(false);
      videoRef.current.srcObject = null;
    }
  };

  const translate = async (imgData = null) => {
    setLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage, image: imgData || image }),
      });
      const data = await response.json();
      setTranslatedText(data.translatedText);
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const speak = () => {
    if (translatedText) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Translator</h1>
      
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="Enter text to translate"
        className="border p-2 rounded"
      />
      
      <input 
        value={targetLanguage} 
        onChange={(e) => setTargetLanguage(e.target.value)} 
        placeholder="Target language"
        className="border p-2 rounded"
      />

      <div className="flex gap-2">
        <button onClick={startCamera} className="bg-blue-500 text-white p-2 rounded flex items-center gap-1">
          <Camera size={18} /> Camera
        </button>
        <button onClick={() => translate()} className="bg-green-500 text-white p-2 rounded flex items-center gap-1">
          <Send size={18} /> Translate
        </button>
      </div>

      {isCameraActive && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
          <video ref={videoRef} className="w-full h-auto rounded" />
          <button onClick={captureImage} className="bg-white text-black p-4 rounded mt-4">Capture</button>
        </div>
      )}

      {translatedText && (
        <div className="border p-4 rounded mt-4 bg-gray-50">
          <p>{translatedText}</p>
          <button onClick={speak} className="mt-2 text-blue-600 flex items-center gap-1">
            <Volume2 size={18} /> Speak
          </button>
        </div>
      )}
    </div>
  );
}
