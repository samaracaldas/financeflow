import type { Metadata } from "next";
import { Familjen_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "FinancesFlow",
  description: "Controle de entradas, saídas e contas para pequenos negócios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${familjen.variable} ${martian.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
