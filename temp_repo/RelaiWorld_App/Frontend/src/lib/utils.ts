import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Conversion utilities for RERA PRM/KA/RERA/ projects
const SQMT_TO_ACRES = 1 / 4046.86; // 1 acre = 4046.86 square meters
const SQMT_TO_SQFT = 10.7639; // 1 square meter = 10.7639 square feet

/**
 * Converts square meters to acres
 */
export function sqmtToAcres(sqmt: number | string): number {
  const numValue = typeof sqmt === 'string' ? parseFloat(sqmt.replace(/[^0-9.-]/g, '')) : sqmt;
  if (isNaN(numValue) || numValue <= 0) return 0;
  return numValue * SQMT_TO_ACRES;
}

/**
 * Converts square meters to square feet
 */
export function sqmtToSqft(sqmt: number | string): number {
  const numValue = typeof sqmt === 'string' ? parseFloat(sqmt.replace(/[^0-9.-]/g, '')) : sqmt;
  if (isNaN(numValue) || numValue <= 0) return 0;
  return numValue * SQMT_TO_SQFT;
}

/**
 * Formats a date to DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Parses a DD/MM/YYYY date string to Date object
 */
export function parseDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Handle RTM case
  if (dateStr.toUpperCase() === 'RTM') return null;
  
  // Match DD/MM/YYYY format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  
  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10) - 1; // Month is 0-indexed
  const yearNum = parseInt(year, 10);
  
  if (dayNum < 1 || dayNum > 31 || monthNum < 0 || monthNum > 11) return null;
  
  const date = new Date(yearNum, monthNum, dayNum);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD format (for date input)
 * Uses local date components to avoid timezone shifts
 */
export function ddmmYYYYToYYYYMMDD(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  if (dateStr.toUpperCase() === 'RTM') return '';
  
  // Match DD/MM/YYYY format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  
  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return '';
  
  // Format as YYYY-MM-DD directly without timezone conversion
  return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
}

/**
 * Converts YYYY-MM-DD to DD/MM/YYYY format
 * Uses direct string parsing to avoid timezone shifts
 */
export function yyyymmddToDDMMYYYY(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  if (dateStr.toUpperCase() === 'RTM') return 'RTM';
  
  // Match YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    // Fallback to Date parsing for other formats
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return formatDateDDMMYYYY(date);
  } catch {
    return dateStr;
  }
  }
  
  const [, year, month, day] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return dateStr;
  
  // Format as DD/MM/YYYY directly without timezone conversion
  return `${String(dayNum).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}/${yearNum}`;
}
