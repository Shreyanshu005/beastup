// ConfigHelper.ts - Groq Only Version
import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { EventEmitter } from "events"

interface Config {
  apiKey: string;
  extractionModel: string;
  solutionModel: string;
  debuggingModel: string;
  language: string;
  opacity: number;
}

export class ConfigHelper extends EventEmitter {
  private configPath: string;
  private defaultConfig: Config = {
    apiKey: "",
    extractionModel: "meta-llama/llama-4-scout-17b-16e-instruct", // Vision model for extraction
    solutionModel: "llama-3.3-70b-versatile",
    debuggingModel: "llama-3.3-70b-versatile",
    language: "python",
    opacity: 1.0
  };

  constructor() {
    super();
    try {
      this.configPath = path.join(app.getPath('userData'), 'config.json');
      console.log('Config path:', this.configPath);
    } catch (err) {
      console.warn('Could not access user data path, using fallback');
      this.configPath = path.join(process.cwd(), 'config.json');
    }
    this.ensureConfigExists();
  }

  private ensureConfigExists(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.saveConfig(this.defaultConfig);
      }
    } catch (err) {
      console.error("Error ensuring config exists:", err);
    }
  }

  private sanitizeModelSelection(model: string): string {
    const allowedModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ];
    if (model === 'llama-3.2-90b-vision-preview' || model === 'llama-3.2-11b-vision-preview') {
      return 'meta-llama/llama-4-scout-17b-16e-instruct';
    }
    if (!allowedModels.includes(model)) {
      console.warn(`Invalid Groq model: ${model}. Using default: llama-3.3-70b-versatile`);
      return 'llama-3.3-70b-versatile';
    }
    return model;
  }

  public loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);

        // Sanitize model selections
        if (config.extractionModel) {
          config.extractionModel = this.sanitizeModelSelection(config.extractionModel);
        }
        if (config.solutionModel) {
          config.solutionModel = this.sanitizeModelSelection(config.solutionModel);
        }
        if (config.debuggingModel) {
          config.debuggingModel = this.sanitizeModelSelection(config.debuggingModel);
        }

        return { ...this.defaultConfig, ...config };
      }
      this.saveConfig(this.defaultConfig);
      return this.defaultConfig;
    } catch (err) {
      console.error("Error loading config:", err);
      return this.defaultConfig;
    }
  }

  public saveConfig(config: Config): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (err) {
      console.error("Error saving config:", err);
    }
  }

  public updateConfig(updates: Partial<Config>): Config {
    try {
      const currentConfig = this.loadConfig();

      // Sanitize model selections
      if (updates.extractionModel) {
        updates.extractionModel = this.sanitizeModelSelection(updates.extractionModel);
      }
      if (updates.solutionModel) {
        updates.solutionModel = this.sanitizeModelSelection(updates.solutionModel);
      }
      if (updates.debuggingModel) {
        updates.debuggingModel = this.sanitizeModelSelection(updates.debuggingModel);
      }

      const newConfig = { ...currentConfig, ...updates };
      this.saveConfig(newConfig);

      // Emit update event for API-related changes
      if (updates.apiKey !== undefined || updates.extractionModel !== undefined ||
        updates.solutionModel !== undefined || updates.debuggingModel !== undefined ||
        updates.language !== undefined) {
        this.emit('config-updated', newConfig);
      }

      return newConfig;
    } catch (error) {
      console.error('Error updating config:', error);
      return this.defaultConfig;
    }
  }

  public hasApiKey(): boolean {
    const config = this.loadConfig();
    return !!config.apiKey && config.apiKey.trim().length > 0;
  }

  public isValidApiKeyFormat(apiKey: string): boolean {
    // Groq API keys start with 'gsk_'
    return /^gsk_[a-zA-Z0-9]{32,}$/.test(apiKey.trim());
  }

  public getOpacity(): number {
    const config = this.loadConfig();
    return config.opacity !== undefined ? config.opacity : 1.0;
  }

  public setOpacity(opacity: number): void {
    const validOpacity = Math.min(1.0, Math.max(0.1, opacity));
    this.updateConfig({ opacity: validOpacity });
  }

  public getLanguage(): string {
    const config = this.loadConfig();
    return config.language || "python";
  }

  public setLanguage(language: string): void {
    this.updateConfig({ language });
  }

  public async testApiKey(apiKey: string): Promise<{ valid: boolean, error?: string }> {
    try {
      if (apiKey && /^gsk_[a-zA-Z0-9]{32,}$/.test(apiKey.trim())) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid Groq API key format. Keys should start with gsk_' };
    } catch (error: any) {
      console.error('Groq API key test failed:', error);
      return { valid: false, error: error.message || 'Unknown error' };
    }
  }
}

export const configHelper = new ConfigHelper();
