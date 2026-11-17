export interface FiftyMostEntry {
    firstName: string;
    lastName: string;
    penName: string | null;
    searchName: string;
    displayName: string;
}

export const normalizeName = (str: string) =>
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

/**
 * Parse an entry from 50most.json.
 *
 * New format: `First "Pen Name" Last`
 * Legacy format: `First Last`
 *
 * For the new format, the first and last words are used to search the Yalies
 * API; the quoted middle is the pen name that should be displayed.
 */
export function parseFiftyMostEntry(raw: string): FiftyMostEntry | null {
    const cleaned = raw.trim().replace(/\s+/g, " ");
    if (!cleaned) return null;

    const quoted = cleaned.match(/^(\S+)\s+"([^"]+)"\s+(\S+)$/);
    if (quoted) {
        const [, firstName, penName, lastName] = quoted;
        return {
            firstName,
            lastName,
            penName,
            searchName: `${firstName} ${lastName}`,
            displayName: penName,
        };
    }

    const words = cleaned.split(" ");
    if (words.length < 2) return null;

    // Legacy entries (plain names or organizations) have no pen name.
    // Keep the full string so middle names and organizations still work.
    return {
        firstName: words[0],
        lastName: words[words.length - 1],
        penName: null,
        searchName: cleaned,
        displayName: cleaned,
    };
}

export function parseFiftyMostList(raw: readonly string[]): FiftyMostEntry[] {
    return raw
        .map(parseFiftyMostEntry)
        .filter((entry): entry is FiftyMostEntry => entry !== null);
}
