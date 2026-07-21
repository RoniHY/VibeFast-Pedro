import "./globals.css"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import config from "@/config"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

// #region agent log
const _dbgAppUrl = process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl
let _dbgUrlOk = false
let _dbgUrlErr = null
try {
  new URL(_dbgAppUrl)
  _dbgUrlOk = true
} catch (e) {
  _dbgUrlErr = e instanceof Error ? e.message : String(e)
}
fetch("http://127.0.0.1:7598/ingest/ede61043-0435-486e-89b5-47fecd17318d", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "0f553b",
  },
  body: JSON.stringify({
    sessionId: "0f553b",
    runId: "pre-fix",
    hypothesisId: "A",
    location: "web/app/layout.js:metadataBase",
    message: "Evaluating NEXT_PUBLIC_APP_URL for metadataBase",
    data: {
      rawAppUrl: _dbgAppUrl,
      hasProtocol: /^https?:\/\//i.test(_dbgAppUrl),
      urlParsesOk: _dbgUrlOk,
      parseError: _dbgUrlErr,
      fromEnv: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    },
    timestamp: Date.now(),
  }),
}).catch(() => {})
// #endregion

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl
  ),
  title: {
    default: config.app.name,
    template: `%s · ${config.app.name}`,
  },
  description: config.app.description,
  openGraph: {
    title: config.app.name,
    description: config.app.description,
    type: "website",
    locale: config.app.locale === "es" ? "es_MX" : "en_US",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
}

export const viewport = {
  themeColor: config.brand.primary,
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang={config.app.locale}
      data-theme="vibefast"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmSans.variable}`}
      style={{ "--color-primary": config.brand.primary }}
    >
      <body className="bg-base-100 text-base-content">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='vibefast'||t==='vibefast-dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
