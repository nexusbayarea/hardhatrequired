import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import HtmlLangSetter from "@/components/shared/HtmlLangSetter";

export const metadata: Metadata = {
  title: "Index Intelligence Engine — Field-Grade Market Intelligence",
  description:
    "AI-powered construction market intelligence. Search by zip, score companies, deploy outreach. Built for teams in the field.",
  keywords: "construction market intelligence, AI leads, company discovery, field operations, IIE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Blocking theme init — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('iie-theme');if(t==='day'||t==='night'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','night');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="overflow-x-hidden">
        <ClientLayout>
          <HtmlLangSetter />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

