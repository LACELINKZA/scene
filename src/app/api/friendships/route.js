import sql from "@/app/api/utils/sql";

// Send friend request
export async function POST(request) {
  try {
    const { user_id, friend_id } = await request.json();

    if (user_id === friend_id) {
      return Response.json(
        { error: "You cannot add yourself as a friend" },
        { status: 400 },
      );
    }

    // Ensure consistent ordering for the unique constraint
    const [id1, id2] =
      user_id < friend_id ? [user_id, friend_id] : [friend_id, user_id];

    // Check if friendship already exists
    const existing = await sql`
      SELECT * FROM friendships
      WHERE user_id_1 = ${id1} AND user_id_2 = ${id2}
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "Friend request already exists" },
        { status: 400 },
      );
    }

    // Create friendship request
    const friendship = await sql`
      INSERT INTO friendships (user_id_1, user_id_2, status)
      VALUES (${id1}, ${id2}, 'pending')
      RETURNING *
    `;

    // Create notification for the friend request
    await sql`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        ${friend_id},
        'friend_request',
        'New Friend Request',
        ${`Someone wants to be friends with you!`},
        ${JSON.stringify({ friendship_id: friendship[0].id, from_user_id: user_id })}
      )
    `;

    return Response.json(friendship[0]);
  } catch (error) {
    console.error("Error creating friendship:", error);
    return Response.json(
      { error: "Failed to send friend request" },
      { status: 500 },
    );
  }
}

// Get friends or friend status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = parseInt(searchParams.get("user_id"));
    const friend_id = searchParams.get("friend_id");

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    // Check specific friendship status
    if (friend_id) {
      const [id1, id2] =
        user_id < parseInt(friend_id)
          ? [user_id, parseInt(friend_id)]
          : [parseInt(friend_id), user_id];

      const friendship = await sql`
        SELECT * FROM friendships
        WHERE user_id_1 = ${id1} AND user_id_2 = ${id2}
      `;

      if (friendship.length === 0) {
        return Response.json({ status: "none" });
      }

      return Response.json({
        status: friendship[0].status,
        friendship: friendship[0],
      });
    }

    // Get all friends
    const friends = await sql`
      SELECT 
        u.*,
        f.status,
        f.created_at as friendship_created_at
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id_1 = ${user_id} THEN u.id = f.user_id_2
          WHEN f.user_id_2 = ${user_id} THEN u.id = f.user_id_1
        END
      )
      WHERE (f.user_id_1 = ${user_id} OR f.user_id_2 = ${user_id})
      AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `;

    return Response.json(friends);
  } catch (error) {
    console.error("Error fetching friendships:", error);
    return Response.json(
      { error: "Failed to fetch friendships" },
      { status: 500 },
    );
  }
}

// Accept or reject friend request
export async function PUT(request) {
  try {
    const { user_id, friend_id, action } = await request.json();

    if (!["accept", "reject"].includes(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const [id1, id2] =
      user_id < friend_id ? [user_id, friend_id] : [friend_id, user_id];

    const updated = await sql`
      UPDATE friendships
      SET status = ${action === "accept" ? "accepted" : "rejected"},
          updated_at = NOW()
      WHERE user_id_1 = ${id1} AND user_id_2 = ${id2}
      RETURNING *
    `;

    if (updated.length === 0) {
      return Response.json({ error: "Friendship not found" }, { status: 404 });
    }

    return Response.json(updated[0]);
  } catch (error) {
    console.error("Error updating friendship:", error);
    return Response.json(
      { error: "Failed to update friendship" },
      { status: 500 },
    );
  }
}

// Delete friendship
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = parseInt(searchParams.get("user_id"));
    const friend_id = parseInt(searchParams.get("friend_id"));

    const [id1, id2] =
      user_id < friend_id ? [user_id, friend_id] : [friend_id, user_id];

    await sql`
      DELETE FROM friendships
      WHERE user_id_1 = ${id1} AND user_id_2 = ${id2}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting friendship:", error);
    return Response.json(
      { error: "Failed to delete friendship" },
      { status: 500 },
    );
  }
}
