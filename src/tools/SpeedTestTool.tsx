import { useState } from 'react';
import { motion } from 'framer-motion';
import './SpeedTestTool.css';

type Status = 'idle' | 'testing' | 'done';

const SpeedTestTool = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);

  const handleStartTest = async () => {
    setStatus('testing');
    setSpeedMbps(null);

    try {
      const startTime = performance.now();
      // Using a 25MB file from Cloudflare for testing
      const response = await fetch('https://speed.cloudflare.com/__down?bytes=25000000');
      
      if (!response.body) {
        throw new Error("Response body is not available.");
      }

      const reader = response.body.getReader();
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedLength += value.length;
      }

      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = receivedLength * 8;
      const mbps = (bitsLoaded / durationInSeconds) / 1_000_000;

      setSpeedMbps(mbps);
      setStatus('done');
    } catch (error) {
      console.error("Speed test failed:", error);
      setStatus('idle');
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="speed-test-container">
      <div className="speed-display">
        <motion.h2 key={speedMbps ? speedMbps.toFixed(2) : '0.00'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {speedMbps ? speedMbps.toFixed(2) : '---'}
        </motion.h2>
        <span>Mbps</span>
      </div>
      <div className="status-text">
        {status === 'testing' && 'Testing download speed...'}
        {status === 'done' && 'Test complete!'}
      </div>
      <button className="test-button" onClick={handleStartTest} disabled={status === 'testing'}>
        {status === 'testing' ? '...' : 'Start Test'}
      </button>
    </div>
  );
};

export default SpeedTestTool;