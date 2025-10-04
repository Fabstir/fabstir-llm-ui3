'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Sun, Moon, Laptop, DollarSign, Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import type { UserSettingsVersion } from '@fabstir/sdk-core';

// Available models with metadata
const AVAILABLE_MODELS = [
  {
    id: 'tiny-vicuna-1b.q4_k_m.gguf',
    name: 'TinyVicuna 1B',
    description: 'Fastest response, lowest cost',
    pricing: '$0.001 per message',
    speed: 'Very Fast',
    quality: 'Good',
  },
  {
    id: 'llama-3.2-1b-instruct.q4_k_m.gguf',
    name: 'Llama 3.2 1B Instruct',
    description: 'Balanced speed and quality',
    pricing: '$0.002 per message',
    speed: 'Fast',
    quality: 'Great',
  },
  {
    id: 'llama-3.2-3b-instruct.q4_k_m.gguf',
    name: 'Llama 3.2 3B Instruct',
    description: 'Higher quality responses',
    pricing: '$0.005 per message',
    speed: 'Medium',
    quality: 'Excellent',
  },
];

interface SetupWizardProps {
  onComplete: (settings: {
    selectedModel: string;
    theme: 'light' | 'dark' | 'auto';
    preferredPaymentToken: 'USDC' | 'ETH';
  }) => Promise<void>;
  onSkip?: () => void;
}

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [selectedPayment, setSelectedPayment] = useState<'USDC' | 'ETH'>('USDC');
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      await onComplete({
        selectedModel,
        theme: selectedTheme,
        preferredPaymentToken: selectedPayment,
      });
    } catch (error) {
      console.error('[SetupWizard] Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>Welcome to Fabstir AI Chat</CardTitle>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
          )}
        </div>

        <CardDescription>
          Let's personalize your experience. This will only take a minute.
        </CardDescription>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {step < totalSteps && (
                <div className="w-2" />
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          Step {currentStep} of {totalSteps}
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {/* Step 1: Model Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Choose Your AI Model</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the model that best fits your needs
                  </p>
                </div>

                <div className="grid gap-3">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedModel === model.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{model.name}</h4>
                            {selectedModel === model.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {model.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {model.pricing}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Speed: {model.speed}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Quality: {model.quality}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Theme Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Choose Your Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred appearance
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedTheme('light')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedTheme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Sun className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                    <div className="text-center">
                      <div className="font-semibold mb-1 flex items-center justify-center gap-2">
                        Light
                        {selectedTheme === 'light' && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bright and clear
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedTheme('dark')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedTheme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Moon className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <div className="text-center">
                      <div className="font-semibold mb-1 flex items-center justify-center gap-2">
                        Dark
                        {selectedTheme === 'dark' && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Easy on the eyes
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedTheme('auto')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedTheme === 'auto'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Laptop className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                    <div className="text-center">
                      <div className="font-semibold mb-1 flex items-center justify-center gap-2">
                        Auto
                        {selectedTheme === 'auto' && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Follow system
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment Token Preference */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Payment Preference</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred payment token
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedPayment('USDC')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedPayment === 'USDC'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <DollarSign className="h-10 w-10 mx-auto mb-3 text-green-500" />
                    <div className="text-center">
                      <div className="font-semibold mb-1 flex items-center justify-center gap-2">
                        USDC
                        {selectedPayment === 'USDC' && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Stablecoin
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('ETH')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedPayment === 'ETH'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Zap className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                    <div className="text-center">
                      <div className="font-semibold mb-1 flex items-center justify-center gap-2">
                        ETH
                        {selectedPayment === 'ETH' && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Native token
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
