import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// GET /api/loading-points - List loading points with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { centerName: { contains: search, mode: "insensitive" } },
        { loadingPointName: { contains: search, mode: "insensitive" } },
        { lotAddress: { contains: search, mode: "insensitive" } },
        { roadAddress: { contains: search, mode: "insensitive" } }
      ]
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const [loadingPoints, total] = await Promise.all([
      prisma.loadingPoint.findMany({
        where,
        include: {
          _count: {
            select: {
              charterRequests: true,
              fixedContracts: true,
              routeTemplates: true,
              centerFares: true
            }
          }
        },
        orderBy: [
          { isActive: "desc" },
          { name: "asc" },
          { centerName: "asc" }
        ],
        skip,
        take: limit,
      }),
      prisma.loadingPoint.count({ where }),
    ])

    return NextResponse.json({
      data: loadingPoints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching loading points:", error)
    return NextResponse.json(
      { error: "Failed to fetch loading points" },
      { status: 500 }
    )
  }
}
