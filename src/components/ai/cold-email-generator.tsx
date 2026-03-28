"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type GeneratedEmail = {
  subject: string;
  body: string;
};

type ColdEmailGeneratorProps = {
  result: GeneratedEmail;
  onChange?: (next: GeneratedEmail) => void;
};

export function ColdEmailGenerator({ result, onChange }: ColdEmailGeneratorProps) {
  const [subject, setSubject] = useState(result.subject);
  const [body, setBody] = useState(result.body);

  useEffect(() => {
    setSubject(result.subject);
    setBody(result.body);
  }, [result.subject, result.body]);

  useEffect(() => {
    onChange?.({ subject, body });
  }, [subject, body, onChange]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Cold Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="generated-subject">Subject</Label>
          <Input
            id="generated-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Email subject line"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="generated-body">Editable Email Preview</Label>
          <Textarea
            id="generated-body"
            rows={14}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Generated email body"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" onClick={() => void copyText(subject, "Subject")}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Subject
          </Button>
          <Button type="button" variant="outline" onClick={() => void copyText(body, "Body")}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Body
          </Button>
          <Button type="button" variant="outline" onClick={() => void copyText(`Subject: ${subject}\n\n${body}`, "Email")}>
            <Copy className="mr-2 h-4 w-4" />
            Copy All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
