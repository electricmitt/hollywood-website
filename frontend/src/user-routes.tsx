import { lazy, type ComponentType } from "react";
import { RouteObject } from "react-router-dom";

// The home page loads with the site; every other page downloads the first time
// someone opens it, so visitors don't pay for pages they never visit.
import App from "./pages/App.tsx";

const RELOAD_KEY = "page-load-retry-at";

/**
 * Lazy-load a page. After a new deploy, a tab that was already open may ask for
 * page files that no longer exist; reload once to pick up the new version.
 */
const page = (load: () => Promise<{ default: ComponentType }>) =>
  lazy(() =>
    load().catch((err) => {
      let lastRetry: number;
      try {
        lastRetry = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {
        throw err; // can't remember the retry, so don't risk a reload loop
      }
      if (Date.now() - lastRetry < 10_000) throw err;
      window.location.reload();
      return new Promise<never>(() => {});
    }),
  );

const About = page(() => import("./pages/About.tsx"));
const BibleStudyPage = page(() => import("./pages/BibleStudyPage.tsx"));
const CalendarPage = page(() => import("./pages/CalendarPage.tsx"));
const EventManager = page(() => import("./pages/EventManager.tsx"));
const Events = page(() => import("./pages/Events.tsx"));
const FamilyMinistryPage = page(() => import("./pages/FamilyMinistryPage.tsx"));
const Give = page(() => import("./pages/Give.tsx"));
const Ministries = page(() => import("./pages/Ministries.tsx"));
const MusicMinistryPage = page(() => import("./pages/MusicMinistryPage.tsx"));
const OutreachMissionsMinistry = page(() => import("./pages/OutreachMissionsMinistry.tsx"));
const PrayerMinistryPage = page(() => import("./pages/PrayerMinistryPage.tsx"));
const SermonManager = page(() => import("./pages/SermonManager.tsx"));
const Sermons = page(() => import("./pages/Sermons.tsx"));
const Visit = page(() => import("./pages/Visit.tsx"));
const WordOfGodMinistry = page(() => import("./pages/WordOfGodMinistry.tsx"));

export const userRoutes: RouteObject[] = [
	{ path: "/about", element: <About /> },
	{ path: "/", element: <App /> },
	{ path: "/bible-study-page", element: <BibleStudyPage /> },
	{ path: "/biblestudypage", element: <BibleStudyPage /> },
	{ path: "/calendar-page", element: <CalendarPage /> },
	{ path: "/calendarpage", element: <CalendarPage /> },
	{ path: "/event-manager", element: <EventManager /> },
	{ path: "/eventmanager", element: <EventManager /> },
	{ path: "/events", element: <Events /> },
	{ path: "/family-ministry-page", element: <FamilyMinistryPage /> },
	{ path: "/familyministrypage", element: <FamilyMinistryPage /> },
	{ path: "/give", element: <Give /> },
	{ path: "/ministries", element: <Ministries /> },
	{ path: "/music-ministry-page", element: <MusicMinistryPage /> },
	{ path: "/musicministrypage", element: <MusicMinistryPage /> },
	{ path: "/outreach-missions-ministry", element: <OutreachMissionsMinistry /> },
	{ path: "/outreachmissionsministry", element: <OutreachMissionsMinistry /> },
	{ path: "/prayer-ministry-page", element: <PrayerMinistryPage /> },
	{ path: "/prayerministrypage", element: <PrayerMinistryPage /> },
	{ path: "/sermon-manager", element: <SermonManager /> },
	{ path: "/sermonmanager", element: <SermonManager /> },
	{ path: "/sermons", element: <Sermons /> },
	{ path: "/visit", element: <Visit /> },
	{ path: "/word-of-god-ministry", element: <WordOfGodMinistry /> },
	{ path: "/wordofgodministry", element: <WordOfGodMinistry /> },
];
