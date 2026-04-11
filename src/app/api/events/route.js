import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
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
      promoter_id,
      is_secret,
      secret_radius,
    } = body;

    if (!title || !location || !event_date || !event_time || !promoter_id) {
      return Response.json(
        { error: "Title, location, date, time, and promoter_id are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO events (title, description, location, latitude, longitude, event_date, event_time, flyer_image, vibe_tags, promoter_id, is_secret, secret_radius)
      VALUES (${title}, ${description || null}, ${location}, ${latitude || null}, ${longitude || null}, ${event_date}, ${event_time}, ${flyer_image || null}, ${vibe_tags || []}, ${promoter_id}, ${is_secret || false}, ${secret_radius || 1})
      RETURNING *
    `;

    // Notify all followers of this promoter about the new event
    const followers = await sql`
      SELECT follower_id FROM follows
      WHERE following_id = ${promoter_id}
    `;

    // Get promoter name for notification
    const promoter = await sql`
      SELECT username FROM users WHERE id = ${promoter_id}
    `;

    // Create notifications for all followers
    if (followers.length > 0 && promoter.length > 0) {
      for (const follower of followers) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES (
            ${follower.follower_id},
            'new_event',
            ${"New Event from " + promoter[0].username},
            ${title + " on " + event_date},
            ${JSON.stringify({ event_id: result[0].id })}
          )
        `;
      }
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating event:", error);
    return Response.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const vibe = searchParams.get("vibe");
    const tonightMode = searchParams.get("tonight_mode") === "true";
    const userLat = parseFloat(searchParams.get("user_lat"));
    const userLon = parseFloat(searchParams.get("user_lon"));

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let query = `
      SELECT e.*, u.username as promoter_name, u.profile_image as promoter_image
      FROM events e
      JOIN users u ON e.promoter_id = u.id
      WHERE e.event_date >= CURRENT_DATE
        AND e.event_date <= $1
    `;
    const values = [sevenDaysFromNow.toISOString().split("T")[0]];
    let paramCount = 2;

    if (tonightMode) {
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      query += ` AND (e.event_date = CURRENT_DATE AND e.event_time <= $${paramCount})`;
      values.push(sixHoursFromNow.toTimeString().split(" ")[0]);
      paramCount++;
    }

    if (city) {
      query += ` AND u.city = $${paramCount}`;
      values.push(city);
      paramCount++;
    }

    if (vibe) {
      query += ` AND $${paramCount} = ANY(e.vibe_tags)`;
      values.push(vibe);
      paramCount++;
    }

    query += ` ORDER BY e.boost_active DESC, e.energy_count DESC, e.created_at DESC`;

    const result = await sql(query, values);

    // Filter secret events based on user location
    const filteredEvents = result.filter((event) => {
      if (!event.is_secret) return true;
      if (!userLat || !userLon || !event.latitude || !event.longitude)
        return false;

      const distance = calculateDistance(
        userLat,
        userLon,
        parseFloat(event.latitude),
        parseFloat(event.longitude),
      );
      return distance <= event.secret_radius;
    });

    return Response.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// Haversine formula to calculate distance in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
