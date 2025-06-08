'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContractById, updateContractStatus } from '@/lib/contracts';
import { Contract } from '@/types/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-toastify';
import Image from 'next/image';

type PageParams = {
  id: string;
};

export default function ContractPage() {
  const params = useParams<PageParams>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState('');
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        if (params?.id) {
          const contractData = await getContractById(params.id);
          setContract(contractData);
          
          // Mark as viewed if not already signed
          if (contractData.status === 'sent') {
            await updateContractStatus(params.id, 'viewed');
          }
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast.error('Error loading contract');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [params?.id]);

  const handleSign = async () => {
    if (!contract || !signatureRef || !signatureName) {
      toast.error('Please provide your name and signature');
      return;
    }

    try {
      const signature = {
        name: signatureName,
        signature: signatureRef.toDataURL(),
        timestamp: new Date(),
      };

      await updateContractStatus(contract.id, 'signed', signature);
      toast.success('Contract signed successfully');
      
      // Refresh contract data
      const updatedContract = await getContractById(contract.id);
      setContract(updatedContract);
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('Error signing contract');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!contract) {
    return <div className="flex justify-center items-center min-h-screen">Contract not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <div className="text-sm text-gray-500">
            Status: <span className="capitalize">{contract.status}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Content */}
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: contract.content }} />
          </div>

          {/* Signature Section */}
          {contract.status === 'sent' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Sign Contract</h3>
              
              <div className="space-y-2">
                <Label htmlFor="signatureName">Full Name</Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <div className="border rounded-md p-2 bg-white">
                  <SignatureCanvas
                    ref={(ref: SignatureCanvas | null) => setSignatureRef(ref)}
                    canvasProps={{
                      className: 'signature-canvas w-full h-40'
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signatureRef?.clear()}
                >
                  Clear
                </Button>
              </div>

              <Button onClick={handleSign} className="w-full">
                Sign Contract
              </Button>
            </div>
          )}

          {/* Signature Display */}
          {contract.clientSignature && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Client Signature</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center">
                    <Image
                      src="/dj-bobby-drake-logo.png"
                      alt="DJ Bobby Drake Logo"
                      width={150}
                      height={60}
                      className="h-15"
                      unoptimized
                      priority
                    />
                  </div>
                  <div className="text-right">
                    <div className="relative w-[200px] h-[80px]">
                      <Image
                        src="/signature-placeholder.png"
                        alt="DJ Signature"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">DJ Bobby Drake</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Image
                    src={contract.clientSignature.signature}
                    alt="Client Signature"
                    width={500}
                    height={200}
                    className="max-w-md border rounded-md mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {contract.djSignature && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">DJ Signature</h3>
              <div className="space-y-2">
                <p>Signed by: {contract.djSignature.name}</p>
                <p>Date: {format(new Date(contract.djSignature.timestamp), 'PPpp')}</p>
                <Image
                  src={contract.djSignature.signature}
                  alt="DJ Signature"
                  width={500}
                  height={200}
                  className="max-w-md border rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 