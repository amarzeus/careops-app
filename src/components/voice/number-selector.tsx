"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhoneNumberOption {
  phoneNumber: string;
  region: string;
  capabilities: string[];
}

interface NumberSelectorProps {
  workspaceId: string;
  agentId?: string;
  onNumberSelected: (phoneNumber: string) => void;
  onCancel?: () => void;
}

/**
 *
 */
export function NumberSelector({ workspaceId: _workspaceId, agentId, onNumberSelected, onCancel }: NumberSelectorProps) {
  const [numbers, setNumbers] = useState<PhoneNumberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [searchCountry, setSearchCountry] = useState("IN");
  const [searchAreaCode, setSearchAreaCode] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const searchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        country: searchCountry,
        ...(searchAreaCode && { areaCode: searchAreaCode }),
      });

      const res = await fetch(`/api/voice/numbers/search?${params}`);
      const data = await res.json();

      if (res.ok) {
        setNumbers(data.numbers || []);
      } else {
        throw new Error(data.error || "Failed to search numbers");
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Could not search phone numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchCountry, searchAreaCode]);

  useEffect(() => {
    searchNumbers();
  }, [searchNumbers]);

  const handleSelectNumber = async (phoneNumber: string) => {
    if (!agentId) {
      toast({
        title: "No Agent Selected",
        description: "Please create a voice agent first before provisioning a number.",
        variant: "destructive",
      });
      return;
    }

    setSelecting(phoneNumber);
    try {
      const res = await fetch("/api/voice/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          agentId,
          label: `Main Number`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to provision number");
      }

      setSelectedNumber(phoneNumber);
      toast({
        title: "Number Provisioned",
        description: `${phoneNumber} has been assigned to your workspace.`,
      });

      onNumberSelected(phoneNumber);
    } catch (error) {
      toast({
        title: "Provisioning Failed",
        description: error instanceof Error ? error.message : "Could not provision phone number",
        variant: "destructive",
      });
    } finally {
      setSelecting(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Select a Phone Number
        </CardTitle>
        <CardDescription>
          Choose a phone number for your voice agent. This number will receive calls and SMS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Country (e.g., IN)"
            value={searchCountry}
            onChange={(e) => setSearchCountry(e.target.value.toUpperCase())}
            className="w-32"
          />
          <Input
            placeholder="Area code (optional)"
            value={searchAreaCode}
            onChange={(e) => setSearchAreaCode(e.target.value)}
            className="w-32"
          />
          <Button onClick={searchNumbers} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {numbers.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No numbers available. Try a different search.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {numbers.map((num) => (
            <div
              key={num.phoneNumber}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedNumber === num.phoneNumber
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
                }`}
              onClick={() => !selecting && handleSelectNumber(num.phoneNumber)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold">{num.phoneNumber}</span>
                {selectedNumber === num.phoneNumber && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {num.region}
                </Badge>
                {num.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-xs capitalize">
                    {cap}
                  </Badge>
                ))}
              </div>
              {selecting === num.phoneNumber && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Provisioning...
                </div>
              )}
            </div>
          ))}
        </div>

        {onCancel && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
