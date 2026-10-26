// Fixed locale so server and client render the same string.
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB");
}
