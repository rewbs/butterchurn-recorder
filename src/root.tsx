// @refresh reload
import { Suspense } from "solid-js";
import {
  useLocation,
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import { unstable_clientOnly } from 'solid-start';

const Header = unstable_clientOnly(() => import("~/components/Header"));

export default function Root() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";
  return (
    <Html lang="en">
      <Head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-830N58B5PT"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer?.push(arguments)}
          gtag('js', new Date());
          gtag('config', 'G-830N58B5PT');
        `}</script>        
        <Title>Vizrecord - a Butterchurn recorder</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6520774740980475"
     crossorigin="anonymous"></script>
        <link rel="icon" type="image/x-icon" href="/favicon.png"></link>
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <nav class="bg-sky-800">
              <Header />
            </nav>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
