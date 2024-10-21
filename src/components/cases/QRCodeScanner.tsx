import React, { useState } from 'react';
import { QrCode } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const [scanning, setScanning] = useState(false);

  const startScanning = () => {
    setScanning(true);
    // In a real implementation, we would initialize the QR code scanner here
    // For this example, we'll simulate a scan after 2 seconds
    setTimeout(() => {
      const simulatedResult = 'CASE-1234';
      onScan(simulatedResult);
      setScanning(false);
    }, 2000);
  };

  return (
    <div>
      <button
        onClick={startScanning}
        disabled={scanning}
        className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 disabled:bg-gray-400"
      >
        <QrCode className="w-5 h-5 mr-2" />
        {scanning ? 'Scanning...' : 'Scan QR Code'}
      </button>
      {scanning && <p className="mt-2 text-sm text-gray-600">Please point your camera at the QR code</p>}
    </div>
  );
};

export default QRCodeScanner;