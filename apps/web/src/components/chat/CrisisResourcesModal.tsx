'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MessageSquare, Mail, ExternalLink, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CrisisAlert {
  final_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

interface CrisisResourcesModalProps {
  crisis: CrisisAlert | null;
  onClose: () => void;
}

const CRISIS_RESOURCES = {
  immediate: [
    {
      name: 'National Suicide Prevention Lifeline',
      contact: '988',
      description: '24/7 crisis support',
      type: 'phone',
      icon: Phone,
    },
    {
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      description: 'Text-based crisis support',
      type: 'text',
      icon: MessageSquare,
    },
    {
      name: 'SAMHSA National Helpline',
      contact: '1-800-662-4357',
      description: 'Mental health & substance abuse',
      type: 'phone',
      icon: Phone,
    },
  ],
  campus: [
    {
      name: 'University Counseling Center',
      contact: 'Contact your campus counseling center',
      description: 'Free counseling services for students',
      icon: Mail,
    },
    {
      name: 'Your Coach',
      contact: 'Reach out to your coach',
      description: 'Your coach is here to support you',
      icon: Mail,
    },
  ],
  online: [
    {
      name: 'Crisis Chat',
      url: 'https://988lifeline.org/chat',
      description: 'Online chat with trained counselor',
      icon: ExternalLink,
    },
    {
      name: 'Mental Health Resources',
      url: 'https://www.mentalhealth.gov/get-help/immediate-help',
      description: 'Comprehensive mental health support',
      icon: ExternalLink,
    },
  ],
};

export function CrisisResourcesModal({ crisis, onClose }: CrisisResourcesModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Auto-open when crisis is detected
  const isOpen = crisis !== null && !acknowledged;

  useEffect(() => {
    if (crisis === null) {
      setAcknowledged(false);
    }
  }, [crisis]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onClose();
  };

  const getSeverityColor = () => {
    switch (crisis?.final_risk_level) {
      case 'CRITICAL':
        return 'bg-muted-foreground/20 border-muted-foreground';
      case 'HIGH':
        return 'bg-muted/20 border-muted-foreground';
      case 'MEDIUM':
        return 'bg-muted/20 border-muted-foreground';
      default:
        return 'bg-blue-100 border-blue-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleAcknowledge()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-muted-foreground" />
            We're Here to Help
          </DialogTitle>
          <DialogDescription className="text-base">
            {crisis?.message ||
              "We noticed your message may indicate you're going through a difficult time. You don't have to face this alone - help is available 24/7."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Immediate Crisis Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-muted-foreground">
              Immediate Crisis Support (24/7)
            </h3>
            <div className="space-y-3">
              {CRISIS_RESOURCES.immediate.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <Card key={index} className="border-2 border-muted-foreground">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-muted-foreground/20">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{resource.name}</h4>
                          <p className="text-2xl font-bold text-muted-foreground my-1">
                            {resource.contact}
                          </p>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                          {resource.type === 'phone' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-muted-foreground text-muted-foreground hover:bg-muted-foreground/10"
                              onClick={() =>
                                (window.location.href = `tel:${resource.contact.replace(/\D/g, '')}`)
                              }
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Campus Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Campus Support</h3>
            <div className="space-y-3">
              {CRISIS_RESOURCES.campus.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{resource.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{resource.contact}</p>
                          <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Online Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Online Support</h3>
            <div className="space-y-3">
              {CRISIS_RESOURCES.online.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-secondary/20">
                          <Icon className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{resource.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Resource
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Important Message */}
          <Card className={`border-2 ${getSeverityColor()}`}>
            <CardContent className="pt-4">
              <p className="font-semibold mb-2">Remember:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>It's okay to ask for help - it's a sign of strength, not weakness</li>
                <li>You are not alone - many people care about your well-being</li>
                <li>Crisis situations are temporary - things can and do get better</li>
                <li>Professional support is available 24/7 at the numbers above</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acknowledge Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = 'tel:988';
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call 988 Now
            </Button>
            <Button onClick={handleAcknowledge} className="bg-blue-600 hover:bg-blue-700">
              I Understand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
