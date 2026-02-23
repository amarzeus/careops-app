"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Phone,
  Search,
  Loader2,
  Check,
  AlertCircle,
  MapPin,
  DollarSign,
  Globe,
  Building,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Country {
  code: string;
  name: string;
  flag: string;
  hasMobile: boolean;
  hasTollfree: boolean;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  isoCountry: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyCost: number;
  numberType: "local" | "tollfree" | "mobile";
}

interface RegulatoryInfo {
  required: boolean;
  documents: string[];
  addressRequired: boolean;
  addressType: string;
  verifiedDocuments: string[];
  complianceMet: boolean;
}

interface NumberSelectorProps {
  workspaceId?: string;
  agentId?: string;
  onNumberSelected: (phoneNumber: string, details: AvailableNumber) => void;
  onCancel?: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  business_registration: "Business Registration",
  identity_proof: "Identity Proof (ID/Passport)",
  address_proof: "Address Proof",
};

/**
 *
 */
export function EnhancedNumberSelector({
  agentId,
  onNumberSelected,
  onCancel,
}: NumberSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedType, setSelectedType] = useState<"local" | "tollfree" | "mobile">("local");
  const [areaCode, setAreaCode] = useState("");
  const [pattern, setPattern] = useState("");

  const [regulatory, setRegulatory] = useState<RegulatoryInfo | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [twilioConfigured, setTwilioConfigured] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, []);

  const searchNumbers = useCallback(async () => {
    setLoading(true);
    setSelectedNumber(null);
    try {
      const params = new URLSearchParams({
        country: selectedCountry,
        type: selectedType,
      });

      if (areaCode) params.set("areaCode", areaCode);
      if (pattern) params.set("pattern", pattern);

      const res = await fetch(`/api/voice/numbers/search?${params}`);
      const data = await res.json();

      if (res.ok) {
        setNumbers(data.numbers || []);
        setRegulatory(data.regulatory);
        setTwilioConfigured(data.twilioConfigured);
      } else {
        throw new Error(data.error || "Failed to search numbers");
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Could not search phone numbers",
        variant: "destructive",
      });
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedType, areaCode, pattern]);

  useEffect(() => {
    if (selectedCountry) {
      searchNumbers();
    }
  }, [selectedCountry, selectedType, searchNumbers]);

  const fetchCountries = async () => {
    try {
      const res = await fetch("/api/voice/numbers/search?listCountries=true");
      if (res.ok) {
        const data = await res.json();
        setCountries(data.countries || []);
        setTwilioConfigured(data.twilioConfigured);
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
    }
  };

  const handleSelectNumber = async (number: AvailableNumber) => {
    if (regulatory && !regulatory.complianceMet) {
      toast({
        title: "Compliance Required",
        description: "Please upload required documents before provisioning this number type",
        variant: "destructive",
      });
      return;
    }

    if (!agentId) {
      toast({
        title: "No Agent Selected",
        description: "Please create a voice agent first before provisioning a number",
        variant: "destructive",
      });
      return;
    }

    setProvisioning(number.phoneNumber);
    try {
      const res = await fetch("/api/voice/numbers/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: number.phoneNumber,
          country: number.isoCountry,
          numberType: number.numberType,
          agentId,
          friendlyName: "Main Number",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "COMPLIANCE_REQUIRED") {
          toast({
            title: "Compliance Required",
            description: "Please upload required documents before provisioning",
            variant: "destructive",
          });
        } else if (data.code === "LIMIT_EXCEEDED") {
          toast({
            title: "Limit Exceeded",
            description: data.error,
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || "Failed to provision number");
        }
        return;
      }

      setSelectedNumber(number.phoneNumber);
      toast({
        title: "Number Provisioned",
        description: `${number.phoneNumber} has been assigned to your workspace.`,
      });

      onNumberSelected(number.phoneNumber, number);
    } catch (error) {
      toast({
        title: "Provisioning Failed",
        description: error instanceof Error ? error.message : "Could not provision phone number",
        variant: "destructive",
      });
    } finally {
      setProvisioning(null);
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(cost * 75);
  };

  const selectedCountryInfo = countries.find((c) => c.code === selectedCountry);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Select a Phone Number
        </CardTitle>
        <CardDescription>
          Choose a phone number for your voice agent. Numbers are provisioned automatically via
          Twilio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!twilioConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Twilio Not Configured</AlertTitle>
            <AlertDescription>
              Phone number provisioning requires Twilio credentials. Contact support to enable this
              feature.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number Type</label>
            <Tabs
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as typeof selectedType)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="local" className="flex-1">
                  Local
                </TabsTrigger>
                {selectedCountryInfo?.hasMobile && (
                  <TabsTrigger value="mobile" className="flex-1">
                    Mobile
                  </TabsTrigger>
                )}
                {selectedCountryInfo?.hasTollfree && (
                  <TabsTrigger value="tollfree" className="flex-1">
                    Toll-Free
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Area Code (Optional)</label>
            <Input
              placeholder="e.g., 415"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search by pattern (e.g., 555*** for vanity numbers)"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="flex-1"
          />
          <Button onClick={searchNumbers} disabled={loading || !twilioConfigured}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {regulatory && !regulatory.complianceMet && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Compliance Documents Required</AlertTitle>
            <AlertDescription>
              <p className="mb-2">This number type requires the following documents:</p>
              <ul className="list-inside list-disc space-y-1">
                {regulatory.documents.map((doc) => (
                  <li
                    key={doc}
                    className={
                      regulatory.verifiedDocuments.includes(doc)
                        ? "text-green-600 line-through"
                        : ""
                    }
                  >
                    {DOCUMENT_LABELS[doc] || doc}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "Document upload will be available soon",
                  })
                }
              >
                <Building className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <Phone className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="font-medium">No numbers available</p>
            <p className="text-sm">Try a different country, area code, or search pattern</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {numbers.map((num) => (
              <div
                key={num.phoneNumber}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedNumber === num.phoneNumber
                    ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                    : "hover:border-primary/50"
                } ${provisioning === num.phoneNumber ? "pointer-events-none opacity-70" : ""}`}
                onClick={() => !provisioning && handleSelectNumber(num)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <span className="font-mono text-lg font-semibold">{num.phoneNumber}</span>
                    {selectedNumber === num.phoneNumber && (
                      <Check className="text-primary ml-2 inline-block h-5 w-5" />
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCost(num.monthlyCost)}/mo</span>
                  </div>
                </div>

                <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {num.locality}, {num.region}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {num.capabilities.voice && (
                    <Badge variant="outline" className="text-xs">
                      Voice
                    </Badge>
                  )}
                  {num.capabilities.sms && (
                    <Badge variant="outline" className="text-xs">
                      SMS
                    </Badge>
                  )}
                  {num.capabilities.mms && (
                    <Badge variant="outline" className="text-xs">
                      MMS
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {num.numberType}
                  </Badge>
                </div>

                {provisioning === num.phoneNumber && (
                  <div className="text-primary mt-3 flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Provisioning...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-muted-foreground text-sm">
            <Globe className="mr-1 inline h-4 w-4" />
            Powered by Twilio • Numbers provisioned instantly
          </p>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
