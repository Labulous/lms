import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

interface ShippingLabelProps {
  shipment: {
    id: string;
    caseId: string;
    clientName: string;
    clientAddress: string;
    shippingProvider: string;
    trackingNumber: string;
    shipmentDate: string;
    expectedDeliveryDate: string;
  };
  labInfo: {
    name: string;
    address: string;
  };
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ shipment, labInfo }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  });

  const handleDownloadPDF = () => {
    if (labelRef.current) {
      html2canvas(labelRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`shipping-label-${shipment.id}.pdf`);
      });
    }
  };

  return (
    <div>
      <div ref={labelRef} className="p-8 border border-gray-300 max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">Shipping Label</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold">From:</h3>
            <p>{labInfo.name}</p>
            <p>{labInfo.address}</p>
          </div>
          <div>
            <h3 className="font-bold">To:</h3>
            <p>{shipment.clientName}</p>
            <p>{shipment.clientAddress}</p>
          </div>
        </div>
        <div className="mt-4">
          <p><strong>Case ID:</strong> {shipment.caseId}</p>
          <p><strong>Shipping Provider:</strong> {shipment.shippingProvider}</p>
          <p><strong>Tracking Number:</strong> {shipment.trackingNumber}</p>
          <p><strong>Shipment Date:</strong> {shipment.shipmentDate}</p>
          <p><strong>Expected Delivery Date:</strong> {shipment.expectedDeliveryDate}</p>
        </div>
        <div className="mt-4 flex justify-center">
          <QRCodeSVG value={`https://track.shipment.com/${shipment.trackingNumber}`} />
        </div>
      </div>
      <div className="mt-4 flex justify-center space-x-4">
        <button
          onClick={handlePrint}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Print Label
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ShippingLabel;