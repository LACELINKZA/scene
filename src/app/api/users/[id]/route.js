import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { username, profile_image, bio, instagram_link, tiktok_link, city } =
      body;

    let query = "UPDATE users SET ";
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (profile_image !== undefined) {
      updates.push(`profile_image = $${paramCount++}`);
      values.push(profile_image);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (instagram_link !== undefined) {
      updates.push(`instagram_link = $${paramCount++}`);
      values.push(instagram_link);
    }
    if (tiktok_link !== undefined) {
      updates.push(`tiktok_link = $${paramCount++}`);
      values.push(tiktok_link);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    query += updates.join(", ");
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}
