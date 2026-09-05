import { AIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { config } from '../config';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_provider) {
    switch (config.ai.provider) {
      case 'gemini':
      default:
        _provider = new GeminiProvider();
    }
  }
  return _provider;
}

export type { AIProvider };
export * from './provider.interface';
