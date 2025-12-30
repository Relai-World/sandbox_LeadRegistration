
function normalizeBhk(bhk: any): string {
    if (!bhk) return '';
    return String(bhk).toLowerCase().replace(/[^0-9.]/g, '').trim() || String(bhk).toLowerCase().trim();
}

console.log('Result for "2 BHK":', normalizeBhk("2 BHK"));
console.log('Result for "3 BHK":', normalizeBhk("3 BHK"));
console.log('Result for "2":', normalizeBhk("2"));
console.log('Result for "":', normalizeBhk(""));
console.log('Result for null:', normalizeBhk(null));
