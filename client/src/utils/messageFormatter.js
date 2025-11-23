// Simple markdown-like formatter
export const formatMessage = (text) => {
  if (!text) return '';

  let formatted = text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Code: `code`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>');

  return formatted;
};

// Check if text contains formatting
export const hasFormatting = (text) => {
  const formattingPatterns = [
    /\*\*.*\*\*/, /__.*__/,  // Bold
    /\*.*\*/, /_.*_/,        // Italic
    /~~.*~~/,                // Strikethrough
    /`.*`/                   // Code
  ];
  
  return formattingPatterns.some(pattern => pattern.test(text));
};