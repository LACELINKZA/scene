import sql from "@/app/api/utils/sql";

export async function DELETE(request, { params }) {
  try {
    const { eventId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete RSVP and decrement energy count in a transaction
    const [rsvp, event] = await sql.transaction([
      sql`DELETE FROM rsvps WHERE user_id = ${userId} AND event_id = ${eventId} RETURNING *`,
      sql`UPDATE events SET energy_count = GREATEST(energy_count - 1, 0) WHERE id = ${eventId} RETURNING *`,
    ]);

    if (rsvp.length === 0) {
      return Response.json({ error: "RSVP not found" }, { status: 404 });
    }

    return Response.json({
      message: "RSVP cancelled successfully",
      energy_count: event[0].energy_count,
    });
  } catch (error) {
    console.error("Error cancelling RSVP:", error);
    return Response.json({ error: "Failed to cancel RSVP" }, { status: 500 });
  }
}
