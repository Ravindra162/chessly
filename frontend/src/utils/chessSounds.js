// Sound utility for chess game audio effects

class ChessSounds {
  constructor() {
    this.sounds = {
      move: new Audio('/move-self.mp3'),
      capture: new Audio('/capture.mp3')
    };
    
    // Preload sounds
    Object.values(this.sounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.5; // Set volume to 50%
    });
  }

  // Play move sound (normal move)
  playMove() {
    try {
      this.sounds.move.currentTime = 0; // Reset to beginning
      this.sounds.move.play().catch(e => console.log('Move sound play failed:', e));
    } catch (error) {
      console.log('Error playing move sound:', error);
    }
  }

  // Play capture sound (when a piece is captured)
  playCapture() {
    try {
      this.sounds.capture.currentTime = 0; // Reset to beginning
      this.sounds.capture.play().catch(e => console.log('Capture sound play failed:', e));
    } catch (error) {
      console.log('Error playing capture sound:', error);
    }
  }

  // Play appropriate sound based on move type
  playMoveSound(move) {
    if (move && move.captured) {
      this.playCapture();
    } else {
      this.playMove();
    }
  }

  // Set volume for all sounds (0.0 to 1.0)
  setVolume(volume) {
    Object.values(this.sounds).forEach(audio => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }

  // Mute/unmute all sounds
  setMuted(muted) {
    Object.values(this.sounds).forEach(audio => {
      audio.muted = muted;
    });
  }
}

// Export singleton instance
export const chessSounds = new ChessSounds();

// Hook for using chess sounds in React components
export const useChessSounds = () => {
  return chessSounds;
};
