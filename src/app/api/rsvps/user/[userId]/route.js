import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const result = await sql`
      SELECT r.*, e.*, u.username as promoter_name, u.profile_image as promoter_image
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.promoter_id = u.id
      WHERE r.user_id = ${userId}
      ORDER BY e.event_date ASC, e.event_time ASC
    `;

    return Response.json(result);
  } catch (error) {
    console.error("Error fetching user RSVPs:", error);
    return Response.json({ error: "Failed to fetch RSVPs" }, { status: 500 });
  }
}
