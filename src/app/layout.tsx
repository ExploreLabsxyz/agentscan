import localFont from "next/font/local";
import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "./ClientLayout";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UniChat",
  description: "UniChat",
  icons: {
    icon: "/unicorn-og.svg",
  },
  openGraph: {
    title: "UniChat",
    description: "UniChat",
    type: "website",
    siteName: "UniChat",
    images: [
      {
        url: "/unicorn-og.svg",
        width: 1200,
        height: 630,
        alt: "UniChat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UniChat",
    description: "UniChat",
    images: ["/unicorn-og.svg"],
  },
};

// const BackgroundStars = () => {
//   const stars = Array(20).fill(null);

//   return (
//     <div className="absolute inset-0 overflow-hidden">
//       {stars.map((_, i) => (
//         <motion.span
//           key={i}
//           className="absolute text-purple-200 text-2xl"
//           initial={{
//             x: Math.random() * window.innerWidth,
//             y: Math.random() * window.innerHeight,
//             scale: Math.random() * 0.5 + 0.5,
//           }}
//           animate={{
//             opacity: [0.3, 1, 0.3],
//             scale: [1, 1.2, 1],
//           }}
//           transition={{
//             duration: 3 + Math.random() * 2,
//             repeat: Infinity,
//             delay: Math.random() * 2,
//           }}
//           style={{
//             left: `${Math.random() * 100}%`,
//             top: `${Math.random() * 100}%`,
//           }}
//         >
//           ⭐
//         </motion.span>
//       ))}
//     </div>
//   );
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientLayout
        geistSansVariable={geistSans.variable}
        geistMonoVariable={geistMono.variable}
      >
        {children}
      </ClientLayout>
    </html>
  );
}
