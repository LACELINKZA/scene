import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return Response.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Set boost active for 24 hours
    const boostExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await sql`
      UPDATE events 
      SET boost_active = true, boost_expires_at = ${boostExpiresAt.toISOString()}
      WHERE id = ${event_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // In a real app, you would handle payment processing here
    // For this MVP, we're just activating the boost

    return Response.json({
      message: "Event boosted successfully",
      event: result[0],
    });
  } catch (error) {
    console.error("Error boosting event:", error);
    return Response.json({ error: "Failed to boost event" }, { status: 500 });
  }
}
