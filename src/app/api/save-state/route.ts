import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'public', '.pir-deck.state.json');
    
    // Write JSON state to the public folder
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving state:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
