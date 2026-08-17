import { Geist, Geist_Mono } from "next/font/google";

// "cyrillic" is load-bearing: without it every Russian page silently falls back
// to a system font. Verified against next/font's metadata — Geist and Geist Mono
// both ship ["cyrillic","latin","latin-ext"], so the two locales share a typeface.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic"] });

export const htmlClassName = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
export const bodyClassName = "min-h-full flex flex-col";
