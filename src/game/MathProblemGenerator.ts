import { DIFFICULTY_CONFIG } from './config';

/**
 * Math Problem Generator
 * Creates math problems with configurable difficulty and operations
 */

export interface MathProblem {
  question: string;
  correctAnswer: number;
  difficulty: number;
  operation: string;
}

export interface ProblemOption {
  value: number;
  isCorrect: boolean;
}

export class MathProblemGenerator {
  private currentDifficulty: keyof typeof DIFFICULTY_CONFIG = 'EASY';
  
  /**
   * Set the current difficulty level
   */
  setDifficulty(difficulty: keyof typeof DIFFICULTY_CONFIG): void {
    this.currentDifficulty = difficulty;
  }
  
  /**
   * Generate problems for multiples mode
   * Returns all correct multiples and some incorrect values
   */
  generateMultiplesProblems(multipleOf: number): ProblemOption[] {
    const problems: ProblemOption[] = [];
    
    // Generate all multiples from 1 to 12
    for (let i = 1; i <= 12; i++) {
      const multiple = multipleOf * i;
      problems.push({
        value: multiple,
        isCorrect: true
      });
    }
    
    // Add some incorrect numbers to make it challenging
    const incorrectNumbers = new Set<number>();
    const correctNumbers = new Set(problems.map(p => p.value));
    
    // Generate numbers that are NOT multiples of the target
    while (incorrectNumbers.size < 8) {
      const randomNum = Math.floor(Math.random() * (multipleOf * 12)) + 1;
      
      // Make sure it's not a multiple and not already used
      if (!correctNumbers.has(randomNum) && randomNum % multipleOf !== 0) {
        incorrectNumbers.add(randomNum);
        problems.push({
          value: randomNum,
          isCorrect: false
        });
      }
    }
    
    // Shuffle the problems
    return this.shuffleArray(problems);
  }
  
  /**
   * Generate a math problem with the current difficulty
   */
  generateProblem(): MathProblem {
    const config = DIFFICULTY_CONFIG[this.currentDifficulty];
    const operation = this.getRandomOperation(config.operations);
    
    let a: number, b: number, correctAnswer: number, question: string;
    
    switch (operation) {
      case '+':
        a = this.getRandomNumber(1, config.maxNumber);
        b = this.getRandomNumber(1, config.maxNumber);
        correctAnswer = a + b;
        question = `${a} + ${b}`;
        break;
        
      case '-':
        a = this.getRandomNumber(1, config.maxNumber);
        b = this.getRandomNumber(1, Math.min(a, config.maxNumber));
        correctAnswer = a - b;
        question = `${a} - ${b}`;
        break;
        
      case '*':
        a = this.getRandomNumber(1, Math.min(12, Math.sqrt(config.maxNumber)));
        b = this.getRandomNumber(1, Math.min(12, Math.sqrt(config.maxNumber)));
        correctAnswer = a * b;
        question = `${a} × ${b}`;
        break;
        
      case '/':
        // Generate a division that results in a whole number
        correctAnswer = this.getRandomNumber(1, Math.min(12, config.maxNumber / 2));
        b = this.getRandomNumber(2, Math.min(12, config.maxNumber / correctAnswer));
        a = correctAnswer * b;
        question = `${a} ÷ ${b}`;
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    return {
      question,
      correctAnswer,
      difficulty: config.level,
      operation
    };
  }
  
  /**
   * Generate multiple choice options for a problem
   */
  generateOptions(problem: MathProblem, numOptions: number = 4): ProblemOption[] {
    const options: ProblemOption[] = [];
    const correctAnswer = problem.correctAnswer;
    const usedValues = new Set<number>();
    
    // Add the correct answer
    options.push({
      value: correctAnswer,
      isCorrect: true
    });
    usedValues.add(correctAnswer);
    
    // Generate wrong answers
    while (options.length < numOptions) {
      let wrongAnswer: number;
      
      // Generate plausible wrong answers
      switch (problem.operation) {
        case '+':
          wrongAnswer = correctAnswer + this.getRandomNumber(-10, 10);
          break;
        case '-':
          wrongAnswer = correctAnswer + this.getRandomNumber(-5, 15);
          break;
        case '*':
          wrongAnswer = correctAnswer + this.getRandomNumber(-correctAnswer/2, correctAnswer);
          break;
        case '/':
          wrongAnswer = correctAnswer + this.getRandomNumber(-correctAnswer/2, correctAnswer/2);
          break;
        default:
          wrongAnswer = correctAnswer + this.getRandomNumber(-10, 10);
      }
      
      // Ensure positive values and no duplicates
      wrongAnswer = Math.max(0, Math.round(wrongAnswer));
      
      if (!usedValues.has(wrongAnswer)) {
        options.push({
          value: wrongAnswer,
          isCorrect: false
        });
        usedValues.add(wrongAnswer);
      }
    }
    
    // Shuffle the options
    return this.shuffleArray(options);
  }
  
  /**
   * Get a random operation from the available operations
   */
  private getRandomOperation(operations: readonly string[]): string {
    return operations[Math.floor(Math.random() * operations.length)];
  }
  
  /**
   * Get a random number between min and max (inclusive)
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export a singleton instance
export const mathProblemGenerator = new MathProblemGenerator(); 