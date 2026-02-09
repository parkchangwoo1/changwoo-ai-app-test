import { toolRegistry } from '../registry';
import { webSearchTool, isWebSearchEnabled } from './webSearch';
import { weatherTool, isWeatherEnabled } from './weather';
import { currentTimeTool } from './currentTime';
import type { RegisteredTool } from '../types';

export function registerEnabledTools(): void {
  toolRegistry.clear();

  toolRegistry.register(currentTimeTool);

  if (isWebSearchEnabled()) {
    toolRegistry.register(webSearchTool);
  }
  if (isWeatherEnabled()) {
    toolRegistry.register(weatherTool);
  }
}

export function getEnabledTools(): RegisteredTool[] {
  const enabled: RegisteredTool[] = [currentTimeTool];

  if (isWebSearchEnabled()) {
    enabled.push(webSearchTool);
  }
  if (isWeatherEnabled()) {
    enabled.push(weatherTool);
  }

  return enabled;
}

export function hasToolsEnabled(): boolean {
  return true;
}

export { webSearchTool, weatherTool, currentTimeTool };
export { isWebSearchEnabled, isWeatherEnabled };
