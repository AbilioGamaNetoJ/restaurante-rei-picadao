import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role;
    if (role !== 'dono' && role !== 'gerente') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const client = await clerkClient();
    const users = await client.users.getUserList();

    // Filter out clients (only return users with a staff role)
    const staff = users.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata as any)?.role || 'cliente',
    })).filter(u => u.role !== 'cliente');

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionários.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const currentUserRole = (sessionClaims?.metadata as any)?.role;
    if (currentUserRole !== 'dono' && currentUserRole !== 'gerente') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    // Restriction: Managers can only create 'funcionario'
    if (currentUserRole === 'gerente' && role !== 'funcionario') {
      return NextResponse.json(
        { error: 'Gerentes só podem cadastrar funcionários.' },
        { status: 403 }
      );
    }

    const client = await clerkClient();
    
    const newUser = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      publicMetadata: { role },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.emailAddresses[0].emailAddress,
      role: (newUser.publicMetadata as any).role,
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || 'Erro ao criar funcionário.' },
      { status: 500 }
    );
  }
}
