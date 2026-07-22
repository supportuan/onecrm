import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import Providers from "@/components/Providers";

const poppins = Poppins({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ONECRM",
  description: "Intelligence Connecting Seamlessly",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='onecrm.loginTheme';var id=localStorage.getItem(k);var t={brand:{b:'#134790',h:'#0b3987',s:'#eaf2fc',p:'#f8fafc',a:'#d50b1c',ah:'#b2101a',w1:'#134790',w2:'#4e7fcc',g:'linear-gradient(105deg, #2a5fb3 0%, #134790 52%, #072f6d 100%)'},aurora:{b:'#5b5ce2',h:'#7c3aed',s:'#f0efff',p:'#f7f8fd',a:'#e31837',ah:'#c4142f',w1:'#7357e8',w2:'#1677ff',g:'linear-gradient(105deg, #1677ff 0%, #7357e8 52%, #d946ef 100%)'},mist:{b:'#008081',h:'#006b6b',s:'#d4e9ea',p:'#f4fafa',a:'#d50b1c',ah:'#b2101a',w1:'#4da7a6',w2:'#2b9595',g:'linear-gradient(105deg, #4da7a6 0%, #2b9595 48%, #008081 100%)'}};var a=t[id]||t.brand;var r=document.documentElement;r.dataset.appearance=id&&t[id]?id:'brand';r.style.setProperty('--brand',a.b);r.style.setProperty('--brand-hover',a.h);r.style.setProperty('--brand-soft',a.s);r.style.setProperty('--brand-page',a.p);r.style.setProperty('--brand-accent',a.a);r.style.setProperty('--brand-accent-hover',a.ah);r.style.setProperty('--ui-wave-primary',a.w1);r.style.setProperty('--ui-wave-secondary',a.w2);r.style.setProperty('--ui-accent-gradient',a.g);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-full flex flex-col bg-brand-page">
        <div className="app-watermark" aria-hidden="true" />
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          <Providers>
            <Layout>{children}</Layout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
