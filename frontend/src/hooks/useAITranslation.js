// src/hooks/useAITranslation.js
// In-memory cache: { "ms:some text": "terjemahan" }
const translationCache = {};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Translates a batch of texts via the backend /api/translate route.
 * Uses an in-memory cache to avoid re-translating the same strings.
 *
 * @param {Object} texts   - { key: "text to translate", ... }
 * @param {string} lang    - target language code, e.g. "ms"
 * @returns {Object}       - { key: "translated text", ... }
 */
export async function translateTexts(texts, lang) {
  if (lang === "en") return texts; // No translation needed for English

  const toFetch = {};
  const result = {};

  // Check cache first
  for (const [key, val] of Object.entries(texts)) {
    const cacheKey = `${lang}:${val}`;
    if (translationCache[cacheKey]) {
      result[key] = translationCache[cacheKey];
    } else if (val) {
      toFetch[key] = val;
    } else {
      result[key] = val; // empty/null, skip
    }
  }

  // Fetch only uncached texts
  if (Object.keys(toFetch).length > 0) {
    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ texts: toFetch, targetLang: lang }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.translations) {
          for (const [key, translated] of Object.entries(data.translations)) {
            const originalVal = toFetch[key];
            const cacheKey = `${lang}:${originalVal}`;
            translationCache[cacheKey] = translated; // Store in cache
            result[key] = translated;
          }
        }
      }
    } catch (err) {
      console.error("AI translation fetch failed:", err);
      // Fallback: return originals
      Object.assign(result, toFetch);
    }
  }

  return result;
}

/**
 * React hook for translating a single item's fields.
 * 
 * Usage:
 *   const { translated, isTranslating } = useAITranslation(
 *     { name: food.name, description: food.description },
 *     i18n.language
 *   );
 * 
 *   Then use: translated.name, translated.description
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function useAITranslation(texts, lang) {
  const [translated, setTranslated] = useState(texts);
  const [isTranslating, setIsTranslating] = useState(false);
  const prevLangRef = useRef(lang);
  const prevTextsRef = useRef(JSON.stringify(texts));

  useEffect(() => {
    const textsChanged = JSON.stringify(texts) !== prevTextsRef.current;
    const langChanged = lang !== prevLangRef.current;

    if (!textsChanged && !langChanged) return;

    prevLangRef.current = lang;
    prevTextsRef.current = JSON.stringify(texts);

    if (lang === "en") {
      setTranslated(texts);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    translateTexts(texts, lang).then((result) => {
      if (!cancelled) {
        setTranslated(result);
        setIsTranslating(false);
      }
    });

    return () => { cancelled = true; };
  }, [lang, JSON.stringify(texts)]);

  return { translated, isTranslating };
}