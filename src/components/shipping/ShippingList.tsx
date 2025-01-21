import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Truck } from 'lucide-react';
import { mockShipments, Shipment } from '../../data/mockShippingData';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

const ShippingList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulating API call with setTimeout
    setTimeout(() => {
      setShipments(mockShipments);
      setFilteredShipments(mockShipments);
    }, 500);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = shipments.filter(
      shipment =>
        shipment.caseId.toLowerCase().includes(term) ||
        shipment.clientName.toLowerCase().includes(term) ||
        shipment.trackingNumber.toLowerCase().includes(term)
    );
    setFilteredShipments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-500';
      case 'In Transit':
        return 'bg-blue-500';
      case 'Shipped':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <PageHeader
          heading="Shipping Management"
          description="Manage and track all your shipments"
        >
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/shipping/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Shipment
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/shipping/providers">
                <Truck className="mr-2 h-4 w-4" />
                Manage Providers
              </Link>
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="mb-6">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell>{shipment.caseId}</TableCell>
                <TableCell>{shipment.clientName}</TableCell>
                <TableCell>{shipment.shippingProvider}</TableCell>
                <TableCell>{shipment.trackingNumber}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(shipment.status)}>
                    {shipment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/shipping/${shipment.id}`}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/shipping/${shipment.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ShippingList;