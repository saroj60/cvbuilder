export const formatHeight = (h: string): string => {
  if (!h) return 'N/A';
  const val = h.trim().toLowerCase();
  
  // if it includes ft or '
  if (val.includes('ft') || val.includes("'") || val.includes("feet")) {
    let feet = 0;
    let inches = 0;

    const quoteMatch = val.match(/(\d+)\s*['ftfeet]+\s*(?:(\d+)\s*["inches]*)?/);
    if (quoteMatch) {
      feet = parseFloat(quoteMatch[1]);
      inches = quoteMatch[2] ? parseFloat(quoteMatch[2]) : 0;
    } else {
      const numMatch = val.match(/(\d+(\.\d+)?)/);
      if (numMatch) feet = parseFloat(numMatch[0]);
    }

    if (feet > 0) {
      const totalFeet = feet + (inches / 12);
      const cm = Math.round(totalFeet * 30.48);
      // Format 5'8" or 5.5 FT
      const ftStr = inches > 0 ? `${feet}'${inches}"` : `${totalFeet} FT`;
      return `${ftStr} (${cm} CM)`;
    }
  }
  
  // if it's just a number or includes cm
  const numMatch = val.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const cm = parseFloat(numMatch[0]);
    const totalFeet = cm / 30.48;
    const feet = Math.floor(totalFeet);
    const inches = Math.round((totalFeet - feet) * 12);
    
    let ftStr = '';
    if (inches === 12) {
      ftStr = `${feet + 1}'0"`;
    } else {
      ftStr = `${feet}'${inches}"`;
    }

    return `${cm} CM (${ftStr})`;
  }
  
  return h;
};

export const formatWeight = (w: string): string => {
  if (!w) return 'N/A';
  const val = w.trim().toLowerCase();
  
  const numMatch = val.match(/^(\d+(\.\d+)?)\s*(kg|lbs)?$/);
  if (numMatch) {
    const num = numMatch[1];
    const unit = numMatch[3] || 'kg';
    return `${num} ${unit.toUpperCase()}`;
  }
  
  return w;
};
