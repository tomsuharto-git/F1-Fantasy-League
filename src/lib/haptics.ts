// Haptic Feedback System

type HapticType = 'position-change' | 'fastest-lap' | 'race-start' | 'race-end' | 'draft-pick';

class HapticFeedback {
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;
  }
  
  /**
   * Trigger haptic feedback
   */
  trigger(type: HapticType, customPattern?: number[]) {
    if (!this.isSupported) return;
    
    const patterns: Record<HapticType, number[]> = {
      'position-change': [50, 30, 50],
      'fastest-lap': [100, 50, 100, 50, 100],
      'race-start': [200],
      'race-end': [100, 100, 300],
      'draft-pick': [30]
    };
    
    const pattern = customPattern || patterns[type];
    navigator.vibrate(pattern);
  }
  
  /**
   * Position change with magnitude-based intensity
   */
  triggerPositionChange(positionDelta: number) {
    if (!this.isSupported) return;
    
    const absDelta = Math.abs(positionDelta);
    
    if (absDelta === 1) {
      navigator.vibrate(30);
    } else if (absDelta === 2) {
      navigator.vibrate([50, 30, 50]);
    } else if (absDelta >= 3) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }
}

export const haptics = new HapticFeedback();
