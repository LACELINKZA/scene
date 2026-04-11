import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { promoter_id, media_url, media_type, caption } =
      await request.json();

    if (!promoter_id || !media_url || !media_type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO gallery (promoter_id, media_url, media_type, caption)
      VALUES (${promoter_id}, ${media_url}, ${media_type}, ${caption || null})
      RETURNING *
    `;

    // Update gallery count
    await sql`
      UPDATE users 
      SET gallery_count = (SELECT COUNT(*) FROM gallery WHERE promoter_id = ${promoter_id})
      WHERE id = ${promoter_id}
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating gallery item:", error);
    return Response.json(
      { error: "Failed to create gallery item" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const promoter_id = searchParams.get("promoter_id");

    if (!promoter_id) {
      return Response.json({ error: "promoter_id required" }, { status: 400 });
    }

    const gallery = await sql`
      SELECT * FROM gallery
      WHERE promoter_id = ${promoter_id}
      ORDER BY created_at DESC
    `;

    return Response.json(gallery);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return Response.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
