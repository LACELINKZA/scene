import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { user_id, gallery_id } = await request.json();

    if (!user_id || !gallery_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO gallery_likes (user_id, gallery_id)
      VALUES (${user_id}, ${gallery_id})
      ON CONFLICT DO NOTHING
    `;

    await sql`
      UPDATE gallery 
      SET likes = (SELECT COUNT(*) FROM gallery_likes WHERE gallery_id = ${gallery_id})
      WHERE id = ${gallery_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error liking gallery item:", error);
    return Response.json(
      { error: "Failed to like gallery item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { user_id, gallery_id } = await request.json();

    if (!user_id || !gallery_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM gallery_likes
      WHERE user_id = ${user_id} AND gallery_id = ${gallery_id}
    `;

    await sql`
      UPDATE gallery 
      SET likes = (SELECT COUNT(*) FROM gallery_likes WHERE gallery_id = ${gallery_id})
      WHERE id = ${gallery_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error unliking gallery item:", error);
    return Response.json(
      { error: "Failed to unlike gallery item" },
      { status: 500 },
    );
  }
}
