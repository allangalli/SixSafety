import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SixSafety - Toronto Neighbourhood Safety Advisor",
  description: "Personalized safety recommendations for Toronto neighbourhoods",
  keywords: ["Toronto", "safety", "crime prevention", "neighbourhood"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
