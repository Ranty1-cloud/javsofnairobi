import { db } from "./db";
export const tripInclude = { destination: true, _count: { select: { seats: { where: { status: "AVAILABLE" as const } } } } };
export const toCard = <T extends { _count: { seats: number } }>(t: T) => ({ ...t, left: t._count.seats });
export const liveArticles = () => ({ publishedAt: { lte: new Date() }, archivedAt: null });
export const upcomingTrips = (take: number) => db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() } }, orderBy: { departsAt: "asc" }, take, include: tripInclude });
