import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT e.*, u.username as promoter_name, u.profile_image as promoter_image, u.bio as promoter_bio
      FROM events e
      JOIN users u ON e.promoter_id = u.id
      WHERE e.id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Update views
    await sql`UPDATE events SET views = views + 1 WHERE id = ${id}`;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    return Response.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      location,
      latitude,
      longitude,
      event_date,
      event_time,
      flyer_image,
      vibe_tags,
    } = body;

    let query = "UPDATE events SET ";
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(longitude);
    }
    if (event_date !== undefined) {
      updates.push(`event_date = $${paramCount++}`);
      values.push(event_date);
    }
    if (event_time !== undefined) {
      updates.push(`event_time = $${paramCount++}`);
      values.push(event_time);
    }
    if (flyer_image !== undefined) {
      updates.push(`flyer_image = $${paramCount++}`);
      values.push(flyer_image);
    }
    if (vibe_tags !== undefined) {
      updates.push(`vibe_tags = $${paramCount++}`);
      values.push(vibe_tags);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    query += updates.join(", ");
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    return Response.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      DELETE FROM events WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ message: "Event cancelled successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return Response.json({ error: "Failed to cancel event" }, { status: 500 });
  }
}
