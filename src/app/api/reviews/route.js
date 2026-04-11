import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { event_id, user_id, rating, comment } = await request.json();

    if (!event_id || !user_id || !rating) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO reviews (event_id, user_id, rating, comment)
      VALUES (${event_id}, ${user_id}, ${rating}, ${comment || null})
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET rating = ${rating}, comment = ${comment || null}
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating review:", error);
    return Response.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");
    const promoter_id = searchParams.get("promoter_id");

    if (!event_id && !promoter_id) {
      return Response.json(
        { error: "event_id or promoter_id required" },
        { status: 400 },
      );
    }

    let reviews;

    if (event_id) {
      reviews = await sql`
        SELECT r.*, u.username, u.profile_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ${event_id}
        ORDER BY r.created_at DESC
      `;
    } else {
      // Get reviews for all events by this promoter
      reviews = await sql`
        SELECT r.*, u.username, u.profile_image, e.title as event_title
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN events e ON r.event_id = e.id
        WHERE e.promoter_id = ${promoter_id}
        ORDER BY r.created_at DESC
      `;
    }

    return Response.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
