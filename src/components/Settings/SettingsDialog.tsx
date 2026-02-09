import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { useToast } from "../../contexts/toast";

type AIModel = {
  id: string;
  name: string;
  description: string;
};

type ModelCategory = {
  key: 'extractionModel' | 'solutionModel' | 'debuggingModel';
  title: string;
  description: string;
  models: AIModel[];
};

const modelCategories: ModelCategory[] = [
  {
    key: 'extractionModel',
    title: 'Problem Extraction',
    description: 'Model used to analyze screenshots',
    models: [
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", description: "Best for image analysis (FREE)" },
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Fast and capable (FREE)" }
    ]
  },
  {
    key: 'solutionModel',
    title: 'Solution Generation',
    description: 'Model used to generate solutions',
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Best for solutions (FREE)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", description: "Ultra fast (FREE)" }
    ]
  },
  {
    key: 'debuggingModel',
    title: 'Debugging',
    description: 'Model used for debugging',
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Best for debugging (FREE)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", description: "Ultra fast (FREE)" }
    ]
  }
];

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [extractionModel, setExtractionModel] = useState("meta-llama/llama-4-scout-17b-16e-instruct");
  const [solutionModel, setSolutionModel] = useState("llama-3.3-70b-versatile");
  const [debuggingModel, setDebuggingModel] = useState("llama-3.3-70b-versatile");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setOpen(value);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        if (config.apiKey) {
          setApiKey(config.apiKey);
          setTempApiKey(config.apiKey);
        }
        if (config.extractionModel) setExtractionModel(config.extractionModel);
        if (config.solutionModel) setSolutionModel(config.solutionModel);
        if (config.debuggingModel) setDebuggingModel(config.debuggingModel);
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };
    if (isOpen) loadConfig();
  }, [isOpen]);

  useEffect(() => {
    const cleanup = window.electronAPI.onShowSettings(() => {
      setIsOpen(true);
    });
    return cleanup;
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const keyToSave = tempApiKey.trim();
      if (!keyToSave.startsWith('gsk_')) {
        showToast("Error", "Groq API keys must start with 'gsk_'", "error");
        setIsLoading(false);
        return;
      }
      await window.electronAPI.updateConfig({
        apiKey: keyToSave,
        extractionModel,
        solutionModel,
        debuggingModel
      });
      setApiKey(keyToSave);
      showToast("Success", "Settings saved successfully!", "success");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("Error", "Failed to save settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getModelSetter = (key: string) => {
    switch (key) {
      case 'extractionModel': return setExtractionModel;
      case 'solutionModel': return setSolutionModel;
      case 'debuggingModel': return setDebuggingModel;
      default: return () => { };
    }
  };

  const getModelValue = (key: string) => {
    switch (key) {
      case 'extractionModel': return extractionModel;
      case 'solutionModel': return solutionModel;
      case 'debuggingModel': return debuggingModel;
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-white/10">
          <Settings className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black/90 border border-white/10 text-white backdrop-blur-xl p-4">
        <DialogHeader className="p-0 mb-3">
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="p-1.5 bg-green-500/20 rounded-lg">
              <Settings className="h-4 w-4 text-green-400" />
            </div>
            Groq Settings (FREE)
          </DialogTitle>
          <DialogDescription className="text-white/60 text-xs">
            Configure your Groq API key. Get a free key at{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
              console.groq.com/keys
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Groq API Key</label>
            <Input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="gsk_..."
              className="bg-black/50 border-white/10 text-white placeholder:text-white/40 focus:ring-green-500/50 focus:border-green-500/50 h-9 text-sm"
            />
            <p className="text-xs text-white/50">
              Free tier includes 6,000 tokens/min for Llama models
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="text-sm font-medium text-white/90">Model Selection</h3>
            {modelCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">{category.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {category.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => getModelSetter(category.key)(model.id)}
                      className={`p-2 text-left rounded-md transition-all ${getModelValue(category.key) === model.id
                        ? "bg-green-500/20 border border-green-500/50"
                        : "bg-black/30 border border-white/5 hover:bg-white/5"
                        }`}
                    >
                      <p className="text-xs font-medium text-white">{model.name}</p>
                      <p className="text-[10px] text-white/50">{model.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-white/10">
          <Button
            onClick={handleSave}
            disabled={isLoading || !tempApiKey.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
