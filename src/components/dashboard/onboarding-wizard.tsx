"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const finish = () => {
    localStorage.setItem("onboarding-complete", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border depth-2 p-6">
        <div className="mb-5 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`h-2.5 w-2.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="step-0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h2 className="text-2xl font-semibold tracking-tight">Welcome to InternIQ!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Track applications, analyze fit, and generate emails - all in one place.
              </p>
              <Button className="mt-6" onClick={() => setStep(1)}>
                Let&apos;s Get Started
              </Button>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div key="step-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Quick Profile Setup</h2>
              <div className="space-y-2">
                <Label htmlFor="onboarding-name">Your name</Label>
                <Input id="onboarding-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)}>Continue</Button>
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="step-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="text-xl font-semibold">Add your first application</h2>
              <div className="space-y-2">
                <Label htmlFor="onboarding-company">Company</Label>
                <Input id="onboarding-company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Stripe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-role">Role</Label>
                <Input id="onboarding-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Software Engineering Intern" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(3)}>Continue</Button>
                <Button variant="ghost" onClick={() => setStep(3)}>
                  I&apos;ll do this later
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div key="step-3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <h2 className="text-xl font-semibold">You&apos;re all set!</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Organize your pipeline in Tracker
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Use AI Analyze to score resume fit
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  Generate personalized outreach emails
                </div>
              </div>
              <Button className="mt-6" onClick={finish}>
                Go to Dashboard
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
