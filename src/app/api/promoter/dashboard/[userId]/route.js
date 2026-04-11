import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // Get all events created by this promoter
    const events = await sql`
      SELECT * FROM events 
      WHERE promoter_id = ${userId}
      ORDER BY event_date DESC, event_time DESC
    `;

    // Calculate total RSVPs
    const totalRsvps = await sql`
      SELECT COUNT(*) as total
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      WHERE e.promoter_id = ${userId}
    `;

    // Get upcoming events
    const upcomingEvents = events.filter((event) => {
      const eventDate = new Date(event.event_date);
      return eventDate >= new Date();
    });

    // Calculate total views
    const totalViews = events.reduce(
      (sum, event) => sum + (event.views || 0),
      0,
    );

    // Get RSVP growth (last 7 days)
    const rsvpGrowth = await sql`
      SELECT DATE(r.timestamp) as date, COUNT(*) as count
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      WHERE e.promoter_id = ${userId}
        AND r.timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(r.timestamp)
      ORDER BY date ASC
    `;

    // Get event-specific analytics
    const eventAnalytics = await Promise.all(
      events.map(async (event) => {
        const rsvps = await sql`
          SELECT COUNT(*) as count FROM rsvps WHERE event_id = ${event.id}
        `;

        return {
          event_id: event.id,
          title: event.title,
          event_date: event.event_date,
          event_time: event.event_time,
          views: event.views,
          rsvps: parseInt(rsvps[0].count),
          energy_count: event.energy_count,
          boost_active: event.boost_active,
        };
      }),
    );

    return Response.json({
      total_rsvps: parseInt(totalRsvps[0].total),
      total_views: totalViews,
      upcoming_events: upcomingEvents.length,
      rsvp_growth: rsvpGrowth,
      events: eventAnalytics,
    });
  } catch (error) {
    console.error("Error fetching promoter dashboard:", error);
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
