import sql from "@/app/api/utils/sql";

// Get notifications for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = parseInt(searchParams.get("user_id"));
    const unread_only = searchParams.get("unread_only") === "true";

    if (!user_id) {
      return Response.json({ error: "user_id required" }, { status: 400 });
    }

    let notifications;
    if (unread_only) {
      notifications = await sql`
        SELECT * FROM notifications
        WHERE user_id = ${user_id} AND read = FALSE
        ORDER BY created_at DESC
      `;
    } else {
      notifications = await sql`
        SELECT * FROM notifications
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    }

    return Response.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// Mark notification as read
export async function PUT(request) {
  try {
    const { notification_id, user_id } = await request.json();

    if (!notification_id && !user_id) {
      return Response.json(
        { error: "notification_id or user_id required" },
        { status: 400 },
      );
    }

    let updated;
    if (notification_id) {
      // Mark single notification as read
      updated = await sql`
        UPDATE notifications
        SET read = TRUE
        WHERE id = ${notification_id}
        RETURNING *
      `;
    } else {
      // Mark all notifications as read for user
      updated = await sql`
        UPDATE notifications
        SET read = TRUE
        WHERE user_id = ${user_id} AND read = FALSE
        RETURNING *
      `;
    }

    return Response.json({ success: true, count: updated.length });
  } catch (error) {
    console.error("Error updating notification:", error);
    return Response.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}

// Create notification (internal use)
export async function POST(request) {
  try {
    const { user_id, type, title, message, data } = await request.json();

    const notification = await sql`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (${user_id}, ${type}, ${title}, ${message}, ${JSON.stringify(data || {})})
      RETURNING *
    `;

    return Response.json(notification[0]);
  } catch (error) {
    console.error("Error creating notification:", error);
    return Response.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}
