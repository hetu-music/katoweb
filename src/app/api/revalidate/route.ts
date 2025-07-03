import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 添加安全验证
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return new NextResponse('ERROR: Invalid secret', { 
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 重新验证音乐库页面
    revalidatePath('/');
    
    const timestamp = new Date().toISOString();
    
    const response = `SUCCESS: Home page revalidated at ${timestamp}`;
    
    return new NextResponse(response, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    
    return new NextResponse('ERROR: Revalidation failed', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 新增: 刷新指定 /song/[id] 页面的 GET 路由
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const id = request.nextUrl.searchParams.get('id');
    
    if (secret !== process.env.REVALIDATE_SECRET) {
      return new NextResponse('ERROR: Invalid secret', { 
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    if (!id) {
      return new NextResponse('ERROR: Missing id parameter', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    const timestamp = new Date().toISOString();
    
    let response: string;
    
    if (id === 'all') {
      revalidatePath('/song/[id]');
      response = `SUCCESS: All song pages revalidated at ${timestamp}`;
    } else {
      revalidatePath(`/song/${id}`);
      response = `SUCCESS: Page /song/${id} revalidated at ${timestamp}`;
    }
    
    return new NextResponse(response, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    
    return new NextResponse('ERROR: Revalidation failed', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}