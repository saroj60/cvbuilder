export interface AIAnalysisResult {
  matchScore: number;
  aiFeedback: string;
  extractedSkills: string[];
  suggestedStatus: 'SHORTLISTED' | 'REJECTED' | 'PENDING';
}

export class AIService {
  /**
   * Simulates AI Resume Screening & Keyword Match calculation
   */
  static async analyzeResume(resumeText: string, jobSkills: string[] = []): Promise<AIAnalysisResult> {
    // In production, integrate OpenAI / Gemini API call here
    const skillsList = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Express', 'Tailwind CSS', 'Docker', 'Python', 'AWS'];
    
    // Pick random subset of skills for mock parsing
    const extractedSkills = skillsList.filter(() => Math.random() > 0.4);
    if (extractedSkills.length === 0) extractedSkills.push('React', 'TypeScript');

    // Calculate score based on job skills match or default calculation
    let matchScore = 75;
    if (jobSkills.length > 0) {
      const matched = jobSkills.filter((skill) => extractedSkills.includes(skill));
      matchScore = Math.round((matched.length / jobSkills.length) * 100);
    } else {
      matchScore = Math.floor(Math.random() * 35) + 65; // 65-100 range
    }

    let suggestedStatus: 'SHORTLISTED' | 'REJECTED' | 'PENDING' = 'PENDING';
    let aiFeedback = '';

    if (matchScore >= 80) {
      suggestedStatus = 'SHORTLISTED';
      aiFeedback = `Strong candidate match (${matchScore}%). Demonstrates key technical expertise in required stack (${extractedSkills.join(', ')}). High recommendation for interview setup.`;
    } else if (matchScore >= 60) {
      suggestedStatus = 'PENDING';
      aiFeedback = `Moderate candidate match (${matchScore}%). Possesses core competencies but lacks secondary requirements. Further manual review recommended.`;
    } else {
      suggestedStatus = 'REJECTED';
      aiFeedback = `Low keyword alignment (${matchScore}%). Key required skills missing from candidate background.`;
    }

    return {
      matchScore,
      aiFeedback,
      extractedSkills,
      suggestedStatus,
    };
  }
}
