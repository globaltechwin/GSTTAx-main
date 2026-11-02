import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "import-export", "view", true);
  if (access instanceof NextResponse) return access;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // import, export, backup
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") || "10", 10) || 10)
    );
    const skip = (page - 1) * pageSize;
    const workspace = workspaceWhere(access.user);

    if (type === "import") {
      const where = search
        ? {
            ...workspace,
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : workspace;

      const [data, total] = await Promise.all([
        prisma.importHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
        }),
        prisma.importHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    if (type === "export") {
      const where = search
        ? {
            ...workspace,
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : workspace;

      const [data, total] = await Promise.all([
        prisma.exportHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
        }),
        prisma.exportHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    if (type === "backup") {
      const where = search
        ? {
            ...workspace,
            OR: [
              { fileName: { contains: search } },
              { module: { contains: search } },
              { user: { contains: search } },
            ],
          }
        : workspace;

      const [data, total] = await Promise.all([
        prisma.backupHistory.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
        }),
        prisma.backupHistory.count({ where }),
      ]);

      return NextResponse.json({ data, total, page, pageSize });
    }

    if (type && type !== "all") {
      return NextResponse.json({ error: "Invalid history type" }, { status: 400 });
    }

    const [imports, exports, backups] = await Promise.all([
      prisma.importHistory.findMany({
        where: workspace,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
      }),
      prisma.exportHistory.findMany({
        where: workspace,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
      }),
      prisma.backupHistory.findMany({
        where: workspace,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { workspace: { select: { id: true, username: true, firstName: true, lastName: true } } },
      }),
    ]);

    return NextResponse.json({ imports, exports, backups });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
