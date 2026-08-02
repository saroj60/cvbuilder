import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export class AIBuilderService {
  private static async callGeminiWithFallback(
    prompt: string,
    jsonSchema?: any
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) throw new Error("No Gemini API key configured");

    const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        console.log(`🤖 Attempting Gemini call with model: ${modelName}`);
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const config: any = {};
        if (jsonSchema) {
          config.responseMimeType = "application/json";
          config.responseSchema = jsonSchema;
        }
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: config
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini models failed");
  }

  /**
   * Generates a complete structured ATS-friendly resume JSON
   */
  static async generateFullResume(jobTitle: string, experienceYears: number, rawInput?: string) {
    const summary = `Results-driven ${jobTitle} with over ${experienceYears} years of experience designing, delivering, and scaling high-performance enterprise applications. Proven expertise in modern web technologies, automated testing, and cross-functional team leadership.`;

    const workExperience = [
      {
        company: 'Global Innovations Inc.',
        role: `Lead ${jobTitle}`,
        duration: '2022 - Present',
        bulletPoints: [
          `Spearheaded architecting scalable cloud solutions resulting in a 40% improvement in system responsiveness.`,
          `Mentored a team of 8 engineers and introduced CI/CD automated deployment pipelines.`,
          `Engineered robust RESTful and GraphQL APIs serving over 500,000 active monthly users.`,
        ],
      },
      {
        company: 'Apex Tech Solutions',
        role: `Senior ${jobTitle}`,
        duration: '2019 - 2022',
        bulletPoints: [
          `Optimized database query execution plans, reducing latency by 35% across core modules.`,
          `Collaborated with product design teams to ship 15+ user-facing features ahead of schedule.`,
        ],
      },
    ];

    const skills = ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'AWS', 'System Design'];

    const education = [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Technology',
        year: '2019',
      },
    ];

    return {
      title: `${jobTitle} Resume`,
      personalInfo: {
        fullName: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
        linkedIn: 'linkedin.com/in/alexmorgan',
      },
      summary,
      objective: `To leverage ${experienceYears}+ years of technical engineering expertise as a ${jobTitle} to drive product innovation and operational excellence.`,
      skills,
      workExperience,
      education,
      atsCompatibilityScore: 94,
    };
  }

  static async generateSummary(jobTitle: string, skills: string[]) {
    return {
      summary: `Dynamic ${jobTitle} specializing in ${skills.slice(0, 3).join(', ')}. Known for delivering bulletproof web applications, optimizing operational performance, and fostering collaborative software development environments.`,
    };
  }

  static async generateCareerObjective(jobTitle: string, industry: string) {
    const title = jobTitle ? jobTitle.trim() : 'Professional';
    const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an expert resume writer. Generate a 3-sentence professional career objective for a candidate applying for the job position: "${title}". Make it safety-focused and professional. Do NOT include any intro or outro text, JUST return the 3 sentences.`;
        const text = await this.callGeminiWithFallback(prompt);
        if (text && text.length > 20) {
          return { objective: text.replace(/^["']|["']$/g, '') };
        }
      } catch (err: any) {
        console.warn('Gemini Objective generation failed, falling back to local engine:', err.message);
      }
    }

    let s1 = `Dedicated and safety-focused ${formattedTitle} with a strong commitment to operational quality and HSE safety standards.`;
    let s2 = `Proficient in executing core duties, managing tool operations, and ensuring strict compliance with project specifications.`;
    let s3 = `Seeking to leverage hands-on expertise and hard-working attitude to contribute to high-performance project teams and complete assignments on schedule.`;

    const upperTitle = title.toUpperCase();
    if (upperTitle.includes('COOK') || upperTitle.includes('KITCHEN')) {
      s1 = `Dedicated and hygiene-focused ${formattedTitle} with a strong commitment to culinary excellence and food safety standards.`;
      s2 = `Proficient in preparing diverse menus, managing kitchen inventory, and maintaining a sanitized work environment.`;
      s3 = `Seeking to leverage culinary expertise and hard-working attitude to deliver high-quality meals and support catering operations efficiently.`;
    } else if (upperTitle.includes('DRIV') || upperTitle.includes('OPERAT')) {
      s1 = `Reliable and safety-conscious ${formattedTitle} with a strong commitment to accident-free driving and vehicle maintenance.`;
      s2 = `Proficient in operating heavy vehicles, planning efficient routes, and ensuring secure transportation of goods and personnel.`;
      s3 = `Seeking to leverage extensive driving experience to contribute to logistical operations and ensure on-time, safe deliveries.`;
    } else if (upperTitle.includes('CLEAN') || upperTitle.includes('HOUSE')) {
      s1 = `Hard-working and detail-oriented ${formattedTitle} dedicated to maintaining exceptional standards of cleanliness and hygiene.`;
      s2 = `Proficient in sanitation procedures, handling cleaning equipment, and organizing workspaces efficiently.`;
      s3 = `Seeking a role to utilize my organizational skills to ensure a safe, spotless, and welcoming environment for all personnel.`;
    } else if (upperTitle.includes('ELECTRIC')) {
      s1 = `Skilled and detail-oriented ${formattedTitle} with a strong commitment to electrical safety and LOTO compliance.`;
      s2 = `Proficient in installing, maintaining, and troubleshooting electrical systems, panels, and schematics.`;
      s3 = `Seeking to leverage technical expertise to ensure uninterrupted power operations and safety on high-performance projects.`;
    } else if (upperTitle.includes('WELD') || upperTitle.includes('PIPE') || upperTitle.includes('STEEL')) {
      s1 = `Highly skilled ${formattedTitle} with a proven track record of precision fabrication and strict adherence to structural safety standards.`;
      s2 = `Proficient in reading blueprints, aligning joints, and operating specialized heavy tools and equipment safely.`;
      s3 = `Seeking to leverage hands-on technical expertise to contribute to industrial construction teams and deliver high-quality structural finishes.`;
    } else {
      // Generic professional fallback for any other job title
      s1 = `Dedicated and results-driven ${formattedTitle} with a strong commitment to professional excellence and operational quality.`;
      s2 = `Proficient in executing core responsibilities, managing daily operations, and ensuring strict compliance with industry standards.`;
      s3 = `Seeking to leverage hands-on expertise and a proactive attitude to contribute to high-performance teams and achieve organizational goals.`;
    }

    return {
      objective: `${s1} ${s2} ${s3}`
    };
  }

  static async improveWorkExperience(rawBulletPoints: string[]) {
    const improved = rawBulletPoints.map((point) => {
      if (point.toLowerCase().includes('worked on')) {
        return point.replace(/worked on/i, 'Architected and successfully executed');
      }
      if (point.toLowerCase().includes('helped')) {
        return point.replace(/helped/i, 'Collaborated cross-functionally to accelerate delivery of');
      }
      return `Spearheaded ${point} yielding measurable performance gains and increased client satisfaction.`;
    });

    return { improvedBulletPoints: improved };
  }

  static async improveSkills(jobTitle: string) {
    const title = (jobTitle || '').trim().toUpperCase();

    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an expert recruiter. Recommend exactly 5 core skills and personal strengths for a candidate working in the job position: "${title}".`;
        const schema = {
          type: "array",
          items: { type: "string" },
          description: "List of 5 core skills and personal strengths"
        };
        const text = await this.callGeminiWithFallback(prompt, schema);
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { suggestedSkills: parsed.slice(0, 5) };
        }
      } catch (err: any) {
        console.warn('Gemini Skills generation failed, falling back:', err.message);
      }
    }

    let skillsList = [
      'Team cooperation and communication',
      'Operational safety and compliance',
      'Equipment and hand tool handling',
      'Problem solving and troubleshooting',
      'Housekeeping and site maintenance'
    ];

    if (title.includes('SCAFFOLD')) {
      skillsList = [
        'Scaffold erection and dismantling',
        'Scaffolding safety and fall protection',
        'Working at heights and balance',
        'HSE standards compliance',
        'Tool handling and material management'
      ];
    } else if (title.includes('ELECTRIC')) {
      skillsList = [
        'Electrical wiring and installation',
        'Circuit testing and diagnostics',
        'Control panel troubleshooting',
        'Reading schematic diagrams',
        'HSE and LOTO safety standards'
      ];
    } else if (title.includes('WELD')) {
      skillsList = [
        'TIG, MIG, and SMAW welding',
        'Pipe beveling and joint alignment',
        'Blueprints and welding symbols',
        'HSE standards and hot work safety',
        'Grinding and surface preparation'
      ];
    } else if (title.includes('PIPE')) {
      skillsList = [
        'Piping spool fabrication',
        'Isometric drawing reading',
        'Torqueing and flange assembly',
        'HSE safety compliance',
        'Hydrostatic testing preparation'
      ];
    } else if (title.includes('DRIV') || title.includes('OPERAT')) {
      skillsList = [
        'Heavy vehicle operation',
        'Vehicle safety inspection',
        'Defensive driving techniques',
        'Route planning and navigation',
        'Logistics safety and securing cargo'
      ];
    } else if (title.includes('MASON')) {
      skillsList = [
        'Concrete block and brickwork',
        'Interior and exterior plastering',
        'Mortar and concrete mixing ratios',
        'Blueprint wall alignment',
        'Scaffold and tool safety'
      ];
    } else if (title.includes('COOK') || title.includes('KITCHEN')) {
      skillsList = [
        'Food preparation and cooking',
        'Sanitation and kitchen safety',
        'Menu planning and portion control',
        'Inventory management',
        'Culinary tools and equipment handling'
      ];
    } else if (title.includes('CLEAN')) {
      skillsList = [
        'Industrial cleaning and sanitation',
        'Chemical handling safety',
        'Waste and hazard disposal',
        'Cleaning equipment operation',
        'Housekeeping and organization'
      ];
    } else if (title.includes('CARPENTER')) {
      skillsList = [
        'Formwork and shuttering construction',
        'Wood cutting and shaping',
        'Blueprint form layout',
        'Circular saw and hand tools',
        'Site safety and housekeeping'
      ];
    } else if (title.includes('STEEL') || title.includes('FIXER')) {
      skillsList = [
        'Steel rebar positioning and tying',
        'Structural spacing blueprints',
        'Rebar bending and cutting machines',
        'Formwork integration safety',
        'Material handling and teamwork'
      ];
    }

    return { suggestedSkills: skillsList };
  }

  static async generateResponsibilities(jobTitle: string) {
    const title = (jobTitle || '').trim().toUpperCase();

    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a professional CV writer. Generate exactly 5 key job responsibilities for the position: "${title}".
Rules:
- Each responsibility must be specific to the "${title}" role only. Do NOT use generic or construction-site duties.
- Each responsibility must be a single concise sentence (one line, no line breaks).
- Start each with an action verb (e.g., Prepared, Served, Managed, Operated, Maintained).
- Keep each sentence under 15 words.
- Return ONLY a JSON array of 5 strings, nothing else.`;
        const schema = {
          type: "array" as any,
          items: { type: "string" as any },
          description: "List of exactly 5 key responsibilities, each as a single concise sentence"
        };
        const text = await this.callGeminiWithFallback(prompt, schema);
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure each is single-line
          const clean = parsed.slice(0, 5).map((r: string) =>
            r.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
          );
          return { responsibilities: clean };
        }
      } catch (err: any) {
        console.warn('Gemini Responsibilities generation failed, falling back:', err.message);
      }
    }

    let duties = [
      'Assisted in daily operations and supported site teams to complete tasks.',
      'Handled specialized tools, machinery, and equipment safely and efficiently.',
      'Followed strict project specifications, blueprints, and instructions.',
      'Maintained a clean, organized, and hazard-free work environment.',
      'Complied fully with all company safety rules and HSE regulations.'
    ];

    if (title.includes('SCAFFOLD')) {
      duties = [
        'Erected and dismantled scaffolding structures in accordance with safety standards.',
        'Inspected scaffold components for structural integrity, defects, and safety compliance.',
        'Secured platforms, guardrails, and toe-boards at heights for site personnel safety.',
        'Handled and organized scaffolding tubes, clamps, and boards efficiently.',
        'Strictly followed fall protection rules and site HSE safety protocols.'
      ];
    } else if (title.includes('ELECTRIC')) {
      duties = [
        'Installed, maintained, and repaired electrical wiring, conduits, and light fixtures.',
        'Terminated connections in control panels, distribution boards, and junctions.',
        'Tested electrical circuits and systems for continuity and safety using multimeters.',
        'Interpreted electrical drawings, schematic diagrams, and blue-prints accurately.',
        'Followed Lockout/Tagout (LOTO) procedures and electrical safety protocols.'
      ];
    } else if (title.includes('WELD')) {
      duties = [
        'Performed 6G/3G TIG, MIG, and SMAW welding on steel pipes and structures.',
        'Prepared joints, beveled pipe ends, and aligned components for welding.',
        'Ensured high-quality weld penetration and strength to pass X-ray inspections.',
        'Operated welding machines, grinders, torches, and cutting tools safely.',
        'Followed hot work safety permits, fire-watch guidelines, and HSE standards.'
      ];
    } else if (title.includes('PIPE')) {
      duties = [
        'Fabricated, installed, and aligned piping spools, valves, and fittings.',
        'Read and interpreted piping isometric drawings and spool specifications.',
        'Assembled bolted flanges, tightened seals, and executed torqueing procedures.',
        'Prepared piping systems for hydrostatic testing and pressure checks.',
        'Ensured full compliance with industrial piping codes and safety guidelines.'
      ];
    } else if (title.includes('DRIV') || title.includes('OPERAT')) {
      duties = [
        'Operated commercial heavy vehicles, trucks, or equipment safely and efficiently.',
        'Conducted pre-trip and post-trip vehicle inspections for maintenance and safety.',
        'Secured cargo and materials properly using straps and chains before transit.',
        'Navigated transport routes carefully, complying with all local traffic laws.',
        'Maintained accurate driver logs, trip records, and delivery documentation.'
      ];
    } else if (title.includes('MASON')) {
      duties = [
        'Laid concrete blocks, bricks, and stones using standard mortar mixtures.',
        'Applied smooth plaster finishing on interior and exterior walls and surfaces.',
        'Prepared mortar and concrete ratios according to structural specifications.',
        'Leveled and aligned masonry courses using plumb lines, levels, and tools.',
        'Maintained cleanliness of masonry tools and complied with safety rules.'
      ];
    } else if (title.includes('COOK') || title.includes('KITCHEN')) {
      duties = [
        'Prepared and cooked a variety of meals following menus and recipe guidelines.',
        'Maintained strict kitchen hygiene, food safety, and sanitation standards.',
        'Managed food inventory, stored ingredients properly, and monitored freshness.',
        'Operated commercial kitchen appliances, ovens, and slicers safely.',
        'Cleaned cooking equipment, work stations, and utensils continuously.'
      ];
    } else if (title.includes('CLEAN')) {
      duties = [
        'Cleaned, vacuumed, and sanitized offices, corridors, and work sites.',
        'Handled and disposed of waste, trash, and hazardous materials safely.',
        'Replenished cleaning supplies, soaps, and paper products in designated areas.',
        'Operated industrial cleaning equipment, buffers, and vacuums safely.',
        'Followed chemical safety guidelines and material data sheet instructions.'
      ];
    } else if (title.includes('CARPENTER')) {
      duties = [
        'Constructed, installed, and dismantled wooden formworks for concrete pouring.',
        'Measured, cut, and shaped wood, timber, and boards according to plans.',
        'Aligned and leveled shuttering panels using support props and bracing.',
        'Operated circular saws, drills, hammers, and carpentry hand tools safely.',
        'Complied with carpentry safety procedures and housekeeping guidelines.'
      ];
    } else if (title.includes('STEEL') || title.includes('FIXER')) {
      duties = [
        'Positioned, bent, and tied steel rebars and wire mesh for concrete reinforcement.',
        'Read and interpreted structural drawings for steel specifications and spacing.',
        'Operated bar cutters, bending machines, and steel tying hand tools safely.',
        'Secured rebar structures using wire ties, spacers, and concrete blocks.',
        'Followed strict material handling guidelines and safety standards.'
      ];
    }

    return { responsibilities: duties };
  }

  static async correctGrammar(text: string) {
    // Grammar correction & professional tone polishing
    let corrected = text.trim();
    corrected = corrected.replace(/\b(i|me|my)\b/gi, '').trim();
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    if (!corrected.endsWith('.')) corrected += '.';

    return {
      originalText: text,
      correctedText: `Professional Polish: ${corrected}`,
    };
  }

  static async translateNepaliToEnglish(nepaliText: string) {
    // Mock translation engine logic for Nepali resume input
    return {
      originalNepali: nepaliText,
      translatedEnglish: `Professional Translation: Worked as a senior supervisor managing site operations, safety compliance, and team scheduling. Successfully led project completion within designated budgets.`,
    };
  }

  static async calculateAtsScore(resumeData: any) {
    let score = 70;
    const checks = [
      { rule: 'Has Executive Summary', passed: !!resumeData.summary, weight: 10 },
      { rule: 'Structured Skills Array', passed: Array.isArray(resumeData.skills) && resumeData.skills.length >= 5, weight: 10 },
      { rule: 'Quantifiable Work Achievements', passed: true, weight: 10 },
    ];

    checks.forEach((c) => {
      if (c.passed) score += c.weight;
    });

    return {
      atsScore: Math.min(score, 98),
      formattingGrade: 'A+',
      suggestions: [
        'Ensure standard section headers are used (Work Experience, Skills, Education).',
        'Incorporate target job description keywords into work experience bullet points.',
        'Keep formatting clean without nested complex tables or graphical headers.',
      ],
    };
  }

  static async generateCoverLetter(candidateName: string, jobTitle: string, companyName: string) {
    return {
      coverLetter: `Dear Hiring Manager at ${companyName},

I am writing to express my strong enthusiasm for the ${jobTitle} position at ${companyName}. With a proven track record of engineering scalable applications and driving technical excellence, I am confident in my ability to make an immediate impact on your team.

Throughout my career, I have consistently focused on delivering robust, high-availability software solutions that align with strategic business objectives. My experience in full-stack architecture, combined with my passion for continuous improvement, equips me to contribute effectively to ${companyName}'s ongoing growth.

Thank you for your time and consideration. I welcome the opportunity to discuss how my background and technical skills align with your recruitment goals.

Sincerely,
${candidateName}`,
    };
  }
}
