
type StockfishMessage = {
  data: string;
};

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private pendingMove: { resolve: (move: string) => void; reject: (reason?: any) => void } | null = null;
  private onEvaluation: ((score: number) => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new Worker('/stockfish/stockfish.js');
      
      this.worker.onerror = (e) => {
          console.error("Stockfish Worker Error:", e);
      };

      this.worker.onmessage = (event: StockfishMessage) => {
        const message = event.data;
        // console.log('Stockfish message:', message); 

        if (message === 'uciok') {
          this.isReady = true;
          // Set default options if needed
        }

        if (message.startsWith('bestmove')) {
          const parts = message.split(' ');
          const move = parts[1];
          if (this.pendingMove) {
            this.pendingMove.resolve(move);
            this.pendingMove = null; 
          }
        }
        
        // Parsing info for evaluation (e.g., "info depth 10 ... score cp 50 ...")
        if (message.startsWith('info') && message.includes('score cp')) {
             const match = message.match(/score cp (-?\d+)/);
             if (match && match[1] && this.onEvaluation) {
                 this.onEvaluation(parseInt(match[1]));
             }
        }
        
        // Handle mate score
         if (message.startsWith('info') && message.includes('score mate')) {
             const match = message.match(/score mate (-?\d+)/);
             if (match && match[1] && this.onEvaluation) {
                 // Convert mate score to large number
                 const mateIn = parseInt(match[1]);
                 const score = mateIn > 0 ? 20000 - mateIn : -20000 - mateIn;
                 this.onEvaluation(score);
             }
        }
      };

      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
    } catch (e) {
      console.error('Failed to initialize Stockfish worker', e);
    }
  }

  public ready(): Promise<void> {
      if (this.isReady) return Promise.resolve();
      return new Promise(resolve => {
          const start = Date.now();
          const check = setInterval(() => {
              if (this.isReady) {
                  clearInterval(check);
                  resolve();
              }
              if (Date.now() - start > 5000) { // Timeout 5s
                  clearInterval(check);
                  console.warn("Stockfish ready timeout");
                  resolve(); // Proceed anyway, maybe it works
              }
          }, 50);
      });
  }

  public async getBestMove(fen: string, depth: number = 10): Promise<string> {
    if (!this.worker) this.init();
    await this.ready();

    return new Promise((resolve, reject) => {
      if (!this.worker) {
            reject('Stockfish worker not initialized');
            return;
      }

      // Stop any previous search
      if (this.pendingMove) {
        this.pendingMove.reject('New search started');
        this.pendingMove = null;
      }
      this.worker.postMessage('stop'); 

      this.pendingMove = { resolve, reject };

      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }
  
  public setSkillLevel(skill: number) {
      if(!this.worker) return;
      // Skill Level is 0-20
      const clampedSkill = Math.max(0, Math.min(20, skill));
      this.worker.postMessage(`setoption name Skill Level value ${clampedSkill}`);
      // Also adjust error probability if needed using UCI_LimitStrength and UCI_Elo?
      // For now, Skill Level is the standard way in older Stockfish, or UCI_LimitStrength in newer.
      // Stockfish 17 might prioritize UCI_Elo.
      // Let's try UCI_Elo for more granular control if needed, but Skill Level is safe generic.
  }
  
  public async setElo(elo: number) {
      if (!this.worker) this.init();
      await this.ready();
      if (!this.worker) return;
      
      this.worker.postMessage(`setoption name UCI_LimitStrength value true`);
      this.worker.postMessage(`setoption name UCI_Elo value ${elo}`);
  }

  public async setContempt(contempt: number) {
      if (!this.worker) this.init();
      await this.ready();
      if (!this.worker) return;

      // Try setting Contempt (works in older Stockfish versions, ignored in newer)
      // Positive = Aggressive/Optimistic, Negative = Defensive/Pessimistic
      this.worker.postMessage(`setoption name UCI_Contempt value ${contempt}`);
      this.worker.postMessage(`setoption name Contempt value ${contempt}`); 
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const stockfish = new StockfishEngine();
