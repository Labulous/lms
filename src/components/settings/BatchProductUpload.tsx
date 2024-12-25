import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Download, Trash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductInput } from '@/services/productsService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Material = Database['public']['Tables']['materials']['Row'];
type ProductType = Database['public']['Tables']['product_types']['Row'];
type BillingType = Database['public']['Tables']['billing_types']['Row'];

interface BatchProductUploadProps {
    onUpload: (products: ProductInput[]) => Promise<void>;
}

const emptyProduct = (): ProductInput => ({
    name: '',
    price: 0,
    lead_time: undefined,
    is_client_visible: true,
    is_taxable: true,
    material_id: '',
    product_type_id: '',
    billing_type_id: '',
    requires_shade: false,
});

const BatchProductUpload: React.FC<BatchProductUploadProps> = ({
    onUpload,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<ProductInput[]>([emptyProduct()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reference data
    const [materials, setMaterials] = useState<Material[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

    useEffect(() => {
        const fetchReferenceData = async () => {
            const [materialsData, productTypesData, billingTypesData] = await Promise.all([
                supabase.from('materials').select('*').order('name'),
                supabase.from('product_types').select('*').order('name'),
                supabase.from('billing_types').select('*').order('name')
            ]);

            if (materialsData.data) setMaterials(materialsData.data);
            if (productTypesData.data) setProductTypes(productTypesData.data);
            if (billingTypesData.data) setBillingTypes(billingTypesData.data);
        };

        if (isOpen) fetchReferenceData();
    }, [isOpen]); // Only fetch when dialog opens

    const addRow = () => {
        setProducts([...products, emptyProduct()]);
    };

    const removeRow = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const updateProduct = (index: number, field: keyof ProductInput, value: any) => {
        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value,
        };
        setProducts(updatedProducts);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n');
                const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
                
                const newProducts: ProductInput[] = [];
                const errors: string[] = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const values = lines[i].split(',').map(v => v.trim());
                    const product: Partial<ProductInput> = {};

                    headers.forEach((header, index) => {
                        const value = values[index];
                        switch(header) {
                            case 'name':
                                product.name = value;
                                break;
                            case 'price':
                                product.price = parseFloat(value) || 0;
                                break;
                            case 'lead time':
                                product.lead_time = parseInt(value) || undefined;
                                break;
                            case 'visible to clients':
                                product.is_client_visible = value.toLowerCase() === 'true';
                                break;
                            case 'taxable':
                                product.is_taxable = value.toLowerCase() === 'true';
                                break;
                            case 'material id':
                                product.material_id = value;
                                break;
                            case 'product type id':
                                product.product_type_id = value;
                                break;
                            case 'billing type id':
                                product.billing_type_id = value;
                                break;
                            case 'requires shade':
                                product.requires_shade = value.toLowerCase() === 'true';
                                break;
                        }
                    });

                    // Validate required fields
                    if (!product.name) {
                        errors.push(`Row ${i}: Name is required`);
                        continue;
                    }
                    if (!product.price) {
                        errors.push(`Row ${i}: Price is required`);
                        continue;
                    }
                    if (!product.product_type_id) {
                        errors.push(`Row ${i}: Product Type ID is required`);
                        continue;
                    }
                    if (!product.material_id) {
                        errors.push(`Row ${i}: Material ID is required`);
                        continue;
                    }
                    if (!product.billing_type_id) {
                        errors.push(`Row ${i}: Billing Type ID is required`);
                        continue;
                    }

                    newProducts.push(product as ProductInput);
                }

                if (errors.length > 0) {
                    toast.error(
                        <div>
                            <p>Errors in CSV file:</p>
                            <ul>
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    );
                    return;
                }

                setProducts(newProducts);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                toast.success(`Successfully parsed ${newProducts.length} products`);
            } catch (error) {
                console.error('Error parsing CSV:', error);
                toast.error('Error parsing CSV file. Please check the format and try again.');
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = [
            'Name',
            'Price',
            'Lead Time',
            'Visible to Clients',
            'Taxable',
            'Material ID',
            'Product Type ID',
            'Billing Type ID',
            'Requires Shade'
        ].join(',');

        const sample = [
            'Sample Product',
            '99.99',
            '5',
            'true',
            'true',
            'material_id_here',
            'product_type_id_here',
            'billing_type_id_here',
            'false'
        ].join(',');

        const csvContent = `${headers}\n${sample}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'product_template.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const validateProducts = (productsToValidate: ProductInput[]): string[] => {
        const errors: string[] = [];
        
        productsToValidate.forEach((product, index) => {
            if (!product.name) errors.push(`Row ${index + 1}: Name is required`);
            if (!product.price) errors.push(`Row ${index + 1}: Price is required`);
            if (!product.product_type_id) errors.push(`Row ${index + 1}: Product Type is required`);
            if (!product.material_id) errors.push(`Row ${index + 1}: Material is required`);
            if (!product.billing_type_id) errors.push(`Row ${index + 1}: Billing Type is required`);
        });

        return errors;
    };

    const handleSubmit = async () => {
        const errors = validateProducts(products);
        if (errors.length > 0) {
            toast.error(
                <div>
                    <p>Please fix the following errors:</p>
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            );
            return;
        }

        try {
            setIsSubmitting(true);
            await onUpload(products);
            toast.success(`Successfully uploaded ${products.length} products`);
            setIsOpen(false);
            setProducts([emptyProduct()]);
        } catch (error) {
            console.error('Error uploading products:', error);
            toast.error('Failed to upload products. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Batch Add Products
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[80vh] w-full overflow-y-auto" aria-describedby="dialog-description">
                <DialogHeader>
                    <DialogTitle>Batch Add Products</DialogTitle>
                </DialogHeader>
                <div id="dialog-description" className="sr-only">
                    Add multiple products at once using either manual entry or CSV upload
                </div>
                <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <div className="space-y-4">
                            {products.map((product, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4">
                                    <div className="grid grid-cols-12 gap-4 items-end">
                                        <div className="col-span-3 space-y-2">
                                            <Label htmlFor={`name-${index}`}>Name</Label>
                                            <Input
                                                id={`name-${index}`}
                                                value={product.name}
                                                onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label htmlFor={`productType-${index}`}>Product Type</Label>
                                            <Select
                                                value={product.product_type_id}
                                                onValueChange={(value) => updateProduct(index, 'product_type_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {productTypes.map((type) => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label htmlFor={`material-${index}`}>Material</Label>
                                            <Select
                                                value={product.material_id}
                                                onValueChange={(value) => updateProduct(index, 'material_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Material" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {materials.map((material) => (
                                                        <SelectItem key={material.id} value={material.id}>
                                                            {material.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <Label htmlFor={`price-${index}`}>Price</Label>
                                            <Input
                                                id={`price-${index}`}
                                                type="number"
                                                value={product.price}
                                                onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label htmlFor={`billingType-${index}`}>Billing Type</Label>
                                            <Select
                                                value={product.billing_type_id}
                                                onValueChange={(value) => updateProduct(index, 'billing_type_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {billingTypes.map((type) => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.label || type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <Label htmlFor={`leadTime-${index}`}>Lead Time</Label>
                                            <Input
                                                id={`leadTime-${index}`}
                                                type="number"
                                                value={product.lead_time || ''}
                                                onChange={(e) => updateProduct(index, 'lead_time', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-end">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeRow(index)}
                                                disabled={products.length === 1}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`clientVisible-${index}`}
                                                checked={product.is_client_visible}
                                                onCheckedChange={(checked) => 
                                                    updateProduct(index, 'is_client_visible', checked)
                                                }
                                            />
                                            <Label htmlFor={`clientVisible-${index}`}>Visible to Clients</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`taxable-${index}`}
                                                checked={product.is_taxable}
                                                onCheckedChange={(checked) => 
                                                    updateProduct(index, 'is_taxable', checked)
                                                }
                                            />
                                            <Label htmlFor={`taxable-${index}`}>Taxable</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`requiresShade-${index}`}
                                                checked={product.requires_shade}
                                                onCheckedChange={(checked) => 
                                                    updateProduct(index, 'requires_shade', checked)
                                                }
                                            />
                                            <Label htmlFor={`requiresShade-${index}`}>Requires Shade</Label>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addRow} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Add Another Product
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="csv">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Button variant="outline" onClick={downloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" /> Download Template
                                </Button>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="max-w-[300px]"
                                />
                            </div>
                            
                            {products.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium mb-2">Preview ({products.length} products)</h3>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Lead Time</TableHead>
                                                    <TableHead>Visible</TableHead>
                                                    <TableHead>Taxable</TableHead>
                                                    <TableHead>Requires Shade</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {products.map((product, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{product.name}</TableCell>
                                                        <TableCell>${product.price}</TableCell>
                                                        <TableCell>{product.lead_time || '-'}</TableCell>
                                                        <TableCell>{product.is_client_visible ? 'Yes' : 'No'}</TableCell>
                                                        <TableCell>{product.is_taxable ? 'Yes' : 'No'}</TableCell>
                                                        <TableCell>{product.requires_shade ? 'Yes' : 'No'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="default" 
                        onClick={handleSubmit}
                        disabled={isSubmitting || products.length === 0}
                    >
                        {isSubmitting ? 'Uploading...' : `Upload ${products.length} Products`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BatchProductUpload;
