import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FAQ from "@/models/faq";

export const GET = async () => {
  await connectToDatabase();
  const faqs = await FAQ.find({});
  return NextResponse.json(faqs);
};

export const POST = async (request: any) => {
  try {
    await connectToDatabase();
    const data = await request.json();
    const newFAQ = await FAQ.create(data);
    return NextResponse.json(newFAQ, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

export const PUT = async (request: any) => {
  try {
    await connectToDatabase();
    const data = await request.json();
    const updatedFAQ = await FAQ.findByIdAndUpdate(data._id, data, {
      new: true,
    });
    if (!updatedFAQ) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json(updatedFAQ);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

export const DELETE = async (request: any) => {
  try {
    await connectToDatabase();
    const data = await request.json();
    const deletedFAQ = await FAQ.findByIdAndDelete(data._id);
    if (!deletedFAQ) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};
