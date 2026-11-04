import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const access=await requireApiAccess(request,"vendors","update"); if(access instanceof NextResponse)return access;
 const id=Number((await params).id); const b=await request.json();
 const existing=await prisma.vendor.findFirst({where:{id,...workspaceWhere(access.user)}}); if(!existing)return NextResponse.json({error:"Vendor not found"},{status:404});
 if(!String(b.name||"").trim())return NextResponse.json({error:"Vendor name is required"},{status:400});
 try { const data=await prisma.vendor.update({where:{id},data:{name:String(b.name).trim(),industry:b.industry||null,email:b.email||null,website:b.website||null,landline:b.landline||null,mobile:b.mobile||null,addressLine1:b.addressLine1||null,addressLine2:b.addressLine2||null,gstnType:b.gstnType||"REGISTERED_REGULAR",gstin:String(b.gstin||"").trim().toUpperCase()||null,pan:b.pan||null,currency:b.currency||"INR",country:b.country||"India",state:b.state||null,pinCode:b.pinCode||null,tcsEnabled:Boolean(b.tcsEnabled),tcsRate:Number(b.tcsRate||0),openingDate:b.openingDate?new Date(b.openingDate):null,openingType:b.openingType==="DEBIT"?"DEBIT":"CREDIT",openingAmount:Number(b.openingAmount||0),portalEnabled:Boolean(b.portalEnabled),status:b.status||existing.status}}); return NextResponse.json(data); }
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to update vendor"},{status:400});}
}
export async function DELETE(request: NextRequest,{params}:{params:Promise<{id:string}>}){
 const access=await requireApiAccess(request,"vendors","delete");if(access instanceof NextResponse)return access;const id=Number((await params).id);
 const row=await prisma.vendor.findFirst({where:{id,...workspaceWhere(access.user)}});if(!row)return NextResponse.json({error:"Vendor not found"},{status:404});
 try{await prisma.vendor.delete({where:{id}});return NextResponse.json({success:true});}catch{return NextResponse.json({error:"Vendor has purchase orders and cannot be deleted. Deactivate it instead."},{status:409});}
}
