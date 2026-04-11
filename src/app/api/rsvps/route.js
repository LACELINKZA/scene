import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, event_id } = body;

    if (!user_id || !event_id) {
      return Response.json(
        { error: "User ID and Event ID are required" },
        { status: 400 },
      );
    }

    // Check if already RSVP'd
    const existing = await sql`
      SELECT * FROM rsvps WHERE user_id = ${user_id} AND event_id = ${event_id}
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Already RSVP'd to this event" },
        { status: 409 },
      );
    }

    // Insert RSVP and increment energy count in a transaction
    const [rsvp, event] = await sql.transaction([
      sql`INSERT INTO rsvps (user_id, event_id) VALUES (${user_id}, ${event_id}) RETURNING *`,
      sql`UPDATE events SET energy_count = energy_count + 1 WHERE id = ${event_id} RETURNING *`,
    ]);

    return Response.json({
      rsvp: rsvp[0],
      energy_count: event[0].energy_count,
    });
  } catch (error) {
    console.error("Error creating RSVP:", error);
    return Response.json({ error: "Failed to RSVP to event" }, { status: 500 });
  }
}
