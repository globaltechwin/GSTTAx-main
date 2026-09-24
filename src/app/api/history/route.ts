import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // import, export, backup
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    if (type === "import") {
      const where = search
        ? {
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.importHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.importHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    if (type === "export") {
      const where = search
        ? {
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.exportHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.exportHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    if (type === "backup") {
      const where = search
        ? {
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.backupHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.backupHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    // All history combined
    const [imports, exports, backups] = await Promise.all([
      prisma.importHistory.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.exportHistory.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.backupHistory.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    return NextResponse.json({ imports, exports, backups });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
