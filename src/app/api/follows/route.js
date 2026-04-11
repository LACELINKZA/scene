import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { follower_id, following_id } = await request.json();

    if (!follower_id || !following_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create follow relationship
    await sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${follower_id}, ${following_id})
      ON CONFLICT DO NOTHING
    `;

    // Update counts
    await sql`
      UPDATE users 
      SET following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = ${follower_id})
      WHERE id = ${follower_id}
    `;

    await sql`
      UPDATE users 
      SET follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = ${following_id})
      WHERE id = ${following_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating follow:", error);
    return Response.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { follower_id, following_id } = await request.json();

    if (!follower_id || !following_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM follows
      WHERE follower_id = ${follower_id} AND following_id = ${following_id}
    `;

    // Update counts
    await sql`
      UPDATE users 
      SET following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = ${follower_id})
      WHERE id = ${follower_id}
    `;

    await sql`
      UPDATE users 
      SET follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = ${following_id})
      WHERE id = ${following_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing:", error);
    return Response.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}

// Check if following
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const follower_id = searchParams.get("follower_id");
    const following_id = searchParams.get("following_id");

    if (!follower_id || !following_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      SELECT * FROM follows
      WHERE follower_id = ${follower_id} AND following_id = ${following_id}
    `;

    return Response.json({ is_following: result.length > 0 });
  } catch (error) {
    console.error("Error checking follow:", error);
    return Response.json(
      { error: "Failed to check follow status" },
      { status: 500 },
    );
  }
}
