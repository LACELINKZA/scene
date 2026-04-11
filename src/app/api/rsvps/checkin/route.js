import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { ticket_id, promoter_id } = await request.json();

    // Find the RSVP by ticket_id
    const rsvps = await sql`
      SELECT r.*, e.promoter_id, e.title as event_title
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      WHERE r.ticket_id = ${ticket_id}
    `;

    if (rsvps.length === 0) {
      return Response.json({ error: "Invalid ticket" }, { status: 404 });
    }

    const rsvp = rsvps[0];

    // Verify the promoter owns this event
    if (rsvp.promoter_id !== promoter_id) {
      return Response.json(
        { error: "You don't have permission to check in this ticket" },
        { status: 403 },
      );
    }

    // Check if already checked in
    if (rsvp.checked_in) {
      return Response.json(
        {
          error: "Already checked in",
          checked_in_at: rsvp.checked_in_at,
        },
        { status: 400 },
      );
    }

    // Mark as checked in
    const updated = await sql`
      UPDATE rsvps
      SET checked_in = TRUE, checked_in_at = NOW()
      WHERE ticket_id = ${ticket_id}
      RETURNING *
    `;

    return Response.json({
      success: true,
      rsvp: updated[0],
      message: `Checked in successfully to ${rsvp.event_title}`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return Response.json(
      { error: "Failed to check in ticket" },
      { status: 500 },
    );
  }
}
