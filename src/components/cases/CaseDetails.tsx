import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, User, FileText, Camera, Package, CircleDot, MoreHorizontal, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Case, CaseProduct, CaseProductTooth, ShadeData } from '@/types/supabase';
import CaseProgress from './CaseProgress';
import PhotoUpload from './PhotoUpload';
import QRCodeScanner from './QRCodeScanner';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define TypeScript interfaces for our data structure
interface CaseFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

interface ExtendedCase extends Case {
  client: {
    id: string;
    client_name: string;
    phone: string;
  };
  doctor?: {
    id: string;
    name: string;
    client: {
      id: string;
      client_name: string;
      phone: string;
    };
  };
  case_products?: CaseProduct[];
}

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseDetail, setCaseDetail] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setError('No case ID provided');
      setLoading(false);
      return;
    }

    const fetchCaseData = async () => {
      try {
        console.log('Fetching case data for ID:', caseId);
        
        const { data: caseData, error } = await supabase
          .from('cases')
          .select(`
            id,
            created_at,
            received_date,
            ship_date,
            status,
            patient_name,
            due_date,
            client:clients!client_id (
              id,
              client_name,
              phone
            ),
            doctor:doctors!doctor_id (
              id,
              name,
              client:clients!client_id (
                id,
                client_name,
                phone
              )
            ),
            case_products (
              id,
              occlusal_details,
              contact_type,
              notes,
              created_at,
              case_product_teeth (
                id,
                tooth_number,
                shade_data
              )
            )
          `)
          .eq('id', caseId)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          return;
        }

        if (!caseData) {
          console.error('No case data found');
          setError('Case not found');
          return;
        }

        console.log('Successfully fetched case data:', caseData);
        setCaseDetail(caseData);
      } catch (error) {
        console.error('Error fetching case data:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId]);

  const handleCompleteStage = async (stageName: string) => {
    // Implement stage completion logic here
    console.log(`Completing stage: ${stageName}`);
  };

  const handlePhotoUpload = async (file: File) => {
    // Implement photo upload logic here
    console.log(`Uploading photo: ${file.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <div className="text-red-600 text-xl mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No case details found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Full-width Header */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-16 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <QRCodeSVG
                  value={caseDetail.qr_code}
                  size={64}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">
                  {caseDetail.patient_name ? (
                    caseDetail.patient_name.includes(',') ? 
                      caseDetail.patient_name :
                      `${caseDetail.patient_name.split(' ').slice(-1)}, ${caseDetail.patient_name.split(' ').slice(0, -1).join(' ')}`
                  ) : 'Unknown Patient'}
                </h1>
                <div className="mt-2 flex items-center space-x-4 text-gray-500">
                  <span>Case ID: {caseDetail?.id.slice(0, 8)}...</span>
                  <span>
                    {caseDetail?.doctor?.name || 'Unknown Doctor'}, 
                    {caseDetail?.doctor?.client?.client_name || 'Unknown Clinic'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-6">
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Print Case Details</DropdownMenuItem>
                    <DropdownMenuItem>Print Label</DropdownMenuItem>
                    <DropdownMenuItem>Print Invoice</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit Case</DropdownMenuItem>
                    <DropdownMenuItem>Delete Case</DropdownMenuItem>
                    <DropdownMenuItem>Archive Case</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button>Complete</Button>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Received Date</span>
                  <span className="font-medium">
                    {new Date(caseDetail.received_date).toLocaleDateString()}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="font-medium">
                    {new Date(caseDetail.due_date).toLocaleDateString()}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500">Appointment</span>
                  <span className="font-medium">Not Set</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with max-width container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Basic Info and Products */}
          <div className="md:col-span-2 space-y-6">
            {/* Case Progress Stepper */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CircleDot className="mr-2" size={20} /> Case Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-50 rounded-md">
                <CaseProgress
                  steps={[
                    {
                      date: caseDetail.created_at || new Date().toISOString(),
                      condition: 'Case Created',
                      technician: 'System',
                      status: 'done',
                      notes: 'Case has been created and is ready for processing'
                    },
                    {
                      date: caseDetail.received_date || new Date().toISOString(),
                      condition: 'In Queue',
                      treatment: 'Waiting for technician',
                      status: caseDetail.status === 'in_queue' ? 'in_progress' : 'done'
                    },
                    {
                      date: new Date().toISOString(),
                      condition: 'Manufacturing',
                      treatment: 'Processing',
                      status: caseDetail.status === 'in_progress' ? 'in_progress' : 'pending'
                    },
                    {
                      date: caseDetail.ship_date || new Date().toISOString(),
                      condition: 'Quality Check',
                      treatment: 'Final Inspection',
                      status: caseDetail.status === 'completed' ? 'done' : 'pending'
                    }
                  ]}
                />
              </CardContent>
            </Card>

            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Clock className="mr-2" size={20} /> Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Current Status:</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium capitalize" 
                      style={{
                        backgroundColor: caseDetail.status === 'in_progress' ? '#EFF6FF' : '#F3F4F6',
                        color: caseDetail.status === 'in_progress' ? '#1D4ED8' : '#374151'
                      }}>
                      {caseDetail.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="mr-2" size={20} /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Patient Name</p>
                    <p className="font-medium">{caseDetail.patient_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">PAN Number</p>
                    <p className="font-medium">{caseDetail.pan_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RX Number</p>
                    <p className="font-medium">{caseDetail.rx_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Billing Type</p>
                    <p className="font-medium capitalize">{caseDetail.billing_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Clock className="mr-2" size={20} /> Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600">Received Date</p>
                    <p className="font-medium">{new Date(caseDetail.received_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-medium">{new Date(caseDetail.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ship Date</p>
                    <p className="font-medium">
                      {caseDetail.ship_date ? new Date(caseDetail.ship_date).toLocaleDateString() : 'Not shipped'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="mr-2" size={20} /> Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseDetail.case_products?.map((product) => (
                  <div key={product.id} className="border-b last:border-b-0 pb-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600">Occlusal Details</p>
                        <p className="font-medium">{product.occlusal_details}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact Type</p>
                        <p className="font-medium">{product.contact_type}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">Notes</p>
                      <p className="font-medium">{product.notes || 'No notes'}</p>
                    </div>
                    {/* Teeth Section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <CircleDot className="mr-2" size={16} /> Selected Teeth
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {product.case_product_teeth.map((tooth) => (
                          <div key={tooth.id} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium mb-2">Tooth #{tooth.tooth_number}</p>
                            <div className="text-sm">
                              {Object.entries(tooth.shade_data).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">{key}:</span>
                                  <span>{value || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Doctor Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="mr-2" size={20} /> Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {caseDetail.doctor?.name || 'Unknown Doctor'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {caseDetail.doctor?.client?.client_name || 'Unknown Clinic'}
                    </p>
                  </div>
                  {caseDetail.doctor?.client?.phone && (
                    <div className="flex items-center text-gray-600">
                      <p className="text-sm">
                        Phone: {caseDetail.doctor.client.phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Files Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileText className="mr-2" size={20} /> Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseDetail.case_files && caseDetail.case_files.length > 0 ? (
                    <div className="space-y-2">
                      {caseDetail.case_files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                        >
                          <span className="text-sm text-gray-600">{file.file_name}</span>
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No files uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Camera className="mr-2" size={20} /> Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PhotoUpload caseId={caseId} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;