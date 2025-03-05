import React from 'react';

interface PrintPageProps {
  type: 'invoice' | 'lab-slip' | 'address-label' | 'qr-code-label' | 'patient-label' | 'selected-order';
  data: any; // Replace 'any' with a more specific type based on the data structure
}

const PrintPage: React.FC<PrintPageProps> = ({ type }) => {
  const renderContent = () => {
    switch (type) {
      case 'invoice':
        return renderInvoice();
      case 'lab-slip':
        return renderLabSlip();
      case 'address-label':
        return renderAddressLabel();
      case 'qr-code-label':
        return renderQRCodeLabel();
      case 'patient-label':
        return renderPatientLabel();
      case 'selected-order':
        return renderSelectedOrder();
      default:
        return <div>Invalid print type</div>;
    }
  };

  const renderInvoice = () => (
    <div className="invoice-slip">
      <h1>Invoice</h1>
      {/* Add invoice details here */}
    </div>
  );

  const renderLabSlip = () => (
    <div className="lab-slip">
      <h1>Lab Slip</h1>
      {/* Add lab slip details here */}
    </div>
  );

  const renderAddressLabel = () => (
    <div className="address-label">
      <h1>Address Label</h1>
      {/* Add address label details here */}
    </div>
  );

  const renderQRCodeLabel = () => (
    <div className="qr-code-label">
      <h1>QR Code Label</h1>
      {/* Add QR code label details here */}
    </div>
  );

  const renderPatientLabel = () => (
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
  const renderSelectedOrder = () => (
    <div className="patient-label">
      <h1>Selected Order</h1>
      {/* Add patient label details here */}
    </div>
  );
};

export default PrintPage;