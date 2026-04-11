import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      username,
      password,
      profile_image,
      bio,
      instagram_link,
      tiktok_link,
      account_type,
      city,
    } = body;

    if (!username || !account_type || !city) {
      return Response.json(
        { error: "Username, account type, and city are required" },
        { status: 400 },
      );
    }

    if (!["party-goer", "promoter"].includes(account_type)) {
      return Response.json(
        { error: "Account type must be party-goer or promoter" },
        { status: 400 },
      );
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = await argon2.hash(password);
    }

    const result = await sql`
      INSERT INTO users (username, password_hash, profile_image, bio, instagram_link, tiktok_link, account_type, city)
      VALUES (${username}, ${password_hash}, ${profile_image || null}, ${bio || null}, ${instagram_link || null}, ${tiktok_link || null}, ${account_type}, ${city})
      RETURNING *
    `;

    // Return user data without password_hash
    const { password_hash: _, ...userData } = result[0];
    return Response.json(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Username already exists" },
        { status: 409 },
      );
    }
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    if (!search) {
      return Response.json({ error: "Search query required" }, { status: 400 });
    }

    const users = await sql`
      SELECT id, username, profile_image, bio, account_type, city
      FROM users
      WHERE LOWER(username) LIKE LOWER(${"%" + search + "%"})
      LIMIT 20
    `;

    return Response.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return Response.json({ error: "Failed to search users" }, { status: 500 });
  }
}
