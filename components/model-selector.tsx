// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import { useState } from 'react';
import { Check, Sparkles, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Available models with metadata
export const AVAILABLE_MODELS = [
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

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel?: string;
  recentModels?: string[];
  onSelectModel: (modelId: string) => void;
}

export function ModelSelector({
  open,
  onOpenChange,
  currentModel,
  recentModels = [],
  onSelectModel,
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onSelectModel(modelId);
    onOpenChange(false);
  };

  // Filter recently used models that still exist in AVAILABLE_MODELS
  const recentModelsList = recentModels
    .filter(id => AVAILABLE_MODELS.some(m => m.id === id))
    .map(id => AVAILABLE_MODELS.find(m => m.id === id)!)
    .filter((model, index, self) => self.findIndex(m => m.id === model.id) === index) // Remove duplicates
    .slice(0, 5); // Max 5

  // All other models (not in recent)
  const otherModels = AVAILABLE_MODELS.filter(
    model => !recentModelsList.some(recent => recent.id === model.id)
  );

  const ModelCard = ({ model }: { model: typeof AVAILABLE_MODELS[0] }) => (
    <button
      onClick={() => handleSelect(model.id)}
      className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
        selectedModel === model.id
          ? 'border-primary bg-primary/5'
          : 'border-muted'
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select AI Model
          </DialogTitle>
          <DialogDescription>
            Choose the model that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recently Used Models */}
          {recentModelsList.length > 0 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">Recently Used</h3>
                </div>
                <div className="grid gap-3">
                  {recentModelsList.map(model => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* All Models */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {recentModelsList.length > 0 ? 'Other Models' : 'All Models'}
            </h3>
            <div className="grid gap-3">
              {(recentModelsList.length > 0 ? otherModels : AVAILABLE_MODELS).map(model => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
