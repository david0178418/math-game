/**
 * Performance Monitoring Utilities
 * Helps track game performance and identify bottlenecks
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastFPSCheck = 0;
  private currentFPS = 0;
  private systemTimings = new Map<string, number[]>();
  private entityCount = 0;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Track frame rendering for FPS calculation
   */
  trackFrame(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFPSCheck >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSCheck));
      this.frameCount = 0;
      this.lastFPSCheck = now;
      
      // Log performance warnings
      if (this.currentFPS < 30) {
        console.warn(`Low FPS detected: ${this.currentFPS}`);
      }
    }
  }
  
  /**
   * Track system execution time
   */
  trackSystemTime(systemName: string, executionTime: number): void {
    if (!this.systemTimings.has(systemName)) {
      this.systemTimings.set(systemName, []);
    }
    
    const timings = this.systemTimings.get(systemName)!;
    timings.push(executionTime);
    
    // Keep only last 60 measurements (1 second at 60fps)
    if (timings.length > 60) {
      timings.shift();
    }
    
    // Warn about slow systems
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    if (avgTime > 5) { // 5ms threshold
      console.warn(`Slow system detected: ${systemName} averaging ${avgTime.toFixed(2)}ms`);
    }
  }
  
  /**
   * Update entity count
   */
  updateEntityCount(count: number): void {
    this.entityCount = count;
    
    // Warn about too many entities
    if (count > 100) {
      console.warn(`High entity count: ${count}`);
    }
  }
  
  /**
   * Get current performance stats
   */
  getStats(): {
    fps: number;
    entityCount: number;
    systemTimings: Record<string, number>;
  } {
    const avgTimings: Record<string, number> = {};
    
    for (const [system, timings] of this.systemTimings.entries()) {
      if (timings.length > 0) {
        avgTimings[system] = timings.reduce((a, b) => a + b, 0) / timings.length;
      }
    }
    
    return {
      fps: this.currentFPS,
      entityCount: this.entityCount,
      systemTimings: avgTimings,
    };
  }
  
  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    const stats = this.getStats();
    console.group('Performance Summary');
    console.log(`FPS: ${stats.fps}`);
    console.log(`Entities: ${stats.entityCount}`);
    console.log('System Timings (avg ms):');
    for (const [system, time] of Object.entries(stats.systemTimings)) {
      console.log(`  ${system}: ${time.toFixed(2)}ms`);
    }
    console.groupEnd();
  }
}

/**
 * Debounce utility for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle utility for limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memory usage monitoring (if available)
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if ('memory' in performance) {
    const memory: any = performance.memory;

    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    };
  }

  return null;
} 