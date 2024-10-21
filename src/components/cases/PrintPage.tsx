import React from 'react';

interface PrintPageProps {
  type: 'invoice' | 'lab-slip' | 'address-label' | 'qr-code-label' | 'patient-label';
  data: any; // Replace 'any' with a more specific type based on the data structure
}

const PrintPage: React.FC<PrintPageProps> = ({ type, data }) => {
  const renderContent = () => {
    switch (type) {
      case 'invoice':
        return renderInvoice(data);
      case 'lab-slip':
        return renderLabSlip(data);
      case 'address-label':
        return renderAddressLabel(data);
      case 'qr-code-label':
        return renderQRCodeLabel(data);
      case 'patient-label':
        return renderPatientLabel(data);
      default:
        return <div>Invalid print type</div>;
    }
  };

  const renderInvoice = (invoiceData: any) => (
    <div className="invoice-slip">
      <h1>Invoice</h1>
      {/* Add invoice details here */}
    </div>
  );

  const renderLabSlip = (labSlipData: any) => (
    <div className="lab-slip">
      <h1>Lab Slip</h1>
      {/* Add lab slip details here */}
    </div>
  );

  const renderAddressLabel = (addressData: any) => (
    <div className="address-label">
      <h1>Address Label</h1>
      {/* Add address label details here */}
    </div>
  );

  const renderQRCodeLabel = (qrCodeData: any) => (
    <div className="qr-code-label">
      <h1>QR Code Label</h1>
      {/* Add QR code label details here */}
    </div>
  );

  const renderPatientLabel = (patientData: any) => (
    <div className="patient-label">
      <h1>Patient Label</h1>
      {/* Add patient label details here */}
    </div>
  );

  return (
    <div className="print-page">
      {renderContent()}
    </div>
  );
};

export default PrintPage;