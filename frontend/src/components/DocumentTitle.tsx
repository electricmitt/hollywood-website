import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "CoGaSoC";
const HOME_TITLE = "CoGaSoC – Church of God and Saints of Christ";

// Page name per route (both the hyphenated and compact paths are registered).
const PAGE_TITLES: Record<string, string> = {
  "/about": "About",
  "/events": "Events",
  "/calendar-page": "Calendar",
  "/calendarpage": "Calendar",
  "/sermons": "Sermons",
  "/give": "Give",
  "/visit": "Plan Your Visit",
  "/ministries": "Ministries",
  "/word-of-god-ministry": "The Word of God",
  "/wordofgodministry": "The Word of God",
  "/music-ministry-page": "Music Ministry",
  "/musicministrypage": "Music Ministry",
  "/outreach-missions-ministry": "Outreach & Missions",
  "/outreachmissionsministry": "Outreach & Missions",
  "/family-ministry-page": "Family Ministry",
  "/familyministrypage": "Family Ministry",
  "/bible-study-page": "Bible Study",
  "/biblestudypage": "Bible Study",
  "/prayer-ministry-page": "Prayer Ministry",
  "/prayerministrypage": "Prayer Ministry",
  "/event-manager": "Event Manager",
  "/eventmanager": "Event Manager",
  "/sermon-manager": "Sermon Manager",
  "/sermonmanager": "Sermon Manager",
};

/** Keeps the browser tab title in sync with the current page. */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = PAGE_TITLES[pathname.replace(/\/+$/, "") || "/"];
    document.title = page ? `${page} | ${SITE_NAME}` : HOME_TITLE;
  }, [pathname]);

  return null;
}
