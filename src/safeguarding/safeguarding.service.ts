import { Injectable } from '@nestjs/common';
import badWords from 'badwords-list';
import { hashCode } from '../utils/string.utils';
import { LanguageDetectionService } from './language-detection.service';
import { whiteListedSet } from './whitelisted-words';

@Injectable()
export class SafeguardingService {
  constructor(private languageDetect: LanguageDetectionService) {}
  clean(message: string) {
    const whitelistSet =
      whiteListedSet[this.languageDetect.detectLanguage(message)];
    const hashMap = new Map();
    // replace whitelisted words into hash
    if (whitelistSet) {
      message = message.replace(whitelistSet, (substring) => {
        const hash = String(hashCode(substring));
        hashMap.set(hash, substring);
        return hash;
      });
    }
    message = message.replace(badWords.regex, '🤬'); // censor english offensive words
    // replace the hash to whitelist words
    if (whitelistSet) {
      return message.replace(/([0-9]+)/g, (substring) => {
        const hash = hashMap.get(substring);
        return hash ? hash : substring;
      });
    }
    return message;
  }

  // an example of how tag id could be sanitized
  cleanTagId(tagId: string): string | null {
    // Remove any non-alphanumeric characters except hyphens and underscores
    // TODO regex for different languages
    let cleanedTagId = tagId.replace(/[^a-zA-Z0-9-_]/g, '');

    // Convert to lowercase, may need to use toLocaleLowerCase in the future
    cleanedTagId = cleanedTagId.toLowerCase();

    // Trim to a maximum length (e.g., 50 characters)
    const maxLength = 50;
    cleanedTagId = cleanedTagId.slice(0, maxLength);

    const badWordsRegex = new RegExp(badWords.array.join('|'), 'gi');
    cleanedTagId = cleanedTagId.replace(badWordsRegex, '');

    // Remove any leading or trailing hyphens or underscores
    cleanedTagId = cleanedTagId.replace(/^[-_]+|[-_]+$/g, '');

    // tag could be empty after cleaning, in which case it returns null and its caller needs to filter out empty ones
    return cleanedTagId.length === 0 ? null : cleanedTagId;
  }
}
