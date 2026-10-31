import { describe, expect, it } from "vitest";
import { buildIcs, currentOrNext, googleCalendarUrl, overlaps, parisNow, resolveRoom, type Session } from "./event";

const s = (o: Partial<Session>): Session => ({
  id: "x", title: "T", format: "talk", track: "tech", startTime: "09:40", durationMinutes: 40, room: null, ...o,
});

describe("room rule", () => {
  it("tech without room → Salle Loire, ground floor", () => {
    expect(resolveRoom(s({ track: "tech" }))).toEqual({ room: "Salle Loire", floor: "rdc" });
  });
  it("decideurs without room → Hémicycle, 1st floor", () => {
    expect(resolveRoom(s({ track: "decideurs" }))).toEqual({ room: "Hémicycle", floor: "f1" });
  });
  it("explicit room wins over track", () => {
    expect(resolveRoom(s({ track: "tech", room: "Hall" })).room).toBe("Hall");
  });
});

describe("overlap", () => {
  it("09:40+40 overlaps 10:00+30", () => {
    expect(overlaps(s({}), s({ startTime: "10:00", durationMinutes: 30 }))).toBe(true);
  });
  it("back-to-back sessions do not overlap", () => {
    expect(overlaps(s({}), s({ startTime: "10:20" }))).toBe(false);
  });
});

describe("now", () => {
  it("reads Paris time (UTC+1 in November)", () => {
    expect(parisNow(new Date("2026-11-17T08:00:00Z"))).toEqual({ date: "2026-11-17", minutes: 9 * 60 });
  });
  it("picks live session, else next", () => {
    const list = [s({ id: "a" }), s({ id: "b", startTime: "10:20" })];
    expect(currentOrNext(list, 9 * 60 + 50)).toEqual({ ids: ["a"], live: true });
    expect(currentOrNext(list, 10 * 60 + 20)).toEqual({ ids: ["b"], live: true });
    expect(currentOrNext(list, 8 * 60)).toEqual({ ids: ["a"], live: false });
  });
});

describe("calendar", () => {
  it("ics uses Paris time, venue address and room in description", () => {
    const ics = buildIcs(s({}), "2026-11-17", "Salle : Salle Loire (Rez-de-chaussée)");
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20261117T094000");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20261117T102000");
    expect(ics).toContain("1 rue de la Loire\\, 44200 Nantes");
    expect(ics).toContain("Salle : Salle Loire");
  });
  it("google link is prefilled", () => {
    const url = new URL(googleCalendarUrl(s({}), "2026-11-17", "Salle : Salle Loire"));
    expect(url.searchParams.get("dates")).toBe("20261117T094000/20261117T102000");
    expect(url.searchParams.get("ctz")).toBe("Europe/Paris");
  });
});
