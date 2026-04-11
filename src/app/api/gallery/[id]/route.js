import sql from "@/app/api/utils/sql";

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Get promoter_id before deleting for count update
    const item = await sql`SELECT promoter_id FROM gallery WHERE id = ${id}`;

    if (item.length === 0) {
      return Response.json(
        { error: "Gallery item not found" },
        { status: 404 },
      );
    }

    const promoter_id = item[0].promoter_id;

    await sql`DELETE FROM gallery WHERE id = ${id}`;

    // Update gallery count
    await sql`
      UPDATE users 
      SET gallery_count = (SELECT COUNT(*) FROM gallery WHERE promoter_id = ${promoter_id})
      WHERE id = ${promoter_id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    return Response.json(
      { error: "Failed to delete gallery item" },
      { status: 500 },
    );
  }
}
