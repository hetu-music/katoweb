import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 添加安全验证
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // 重新验证音乐库页面
    revalidatePath('/');
    
    return NextResponse.json({ 
      message: 'Page revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { message: 'Error revalidating page' },
      { status: 500 }
    );
  }
}

// 新增: 刷新指定 /song/[id] 页面的 GET 路由
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const id = request.nextUrl.searchParams.get('id');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 });
    }
    if (id === 'all') {
      // 刷新所有歌曲详情页
      revalidatePath('/song/[id]');
      return NextResponse.json({
        message: 'All song detail pages revalidated successfully',
        timestamp: new Date().toISOString()
      });
    }
    revalidatePath(`/song/${id}`);
    return NextResponse.json({
      message: `Page /song/${id} revalidated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { message: 'Error revalidating page' },
      { status: 500 }
    );
  }
}