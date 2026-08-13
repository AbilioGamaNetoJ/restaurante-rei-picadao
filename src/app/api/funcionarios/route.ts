import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { can, getRoleFromClaims, isRole } from '@/lib/permissions';

const createEmployeeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['gerente', 'funcionario']),
}).strict();

async function getStaffManager() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);
  return { userId, role };
}

export async function GET() {
  try {
    const { userId, role } = await getStaffManager();
    if (!userId || !can(role, 'manage_staff')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const client = await clerkClient();
    const users = await client.users.getUserList();
    const staff = users.data.flatMap((user) => {
      const userRole = (user.publicMetadata as Record<string, unknown>).role;
      if (!isRole(userRole) || userRole === 'cliente') return [];

      return [{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        role: userRole,
      }];
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Failed to fetch employees', error);
    return NextResponse.json({ error: 'Erro ao buscar funcionários.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, role: currentRole } = await getStaffManager();
    if (!userId || !can(currentRole, 'manage_staff')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const input = createEmployeeSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Dados de funcionário inválidos.' }, { status: 400 });
    }
    if (currentRole === 'gerente' && input.data.role !== 'funcionario') {
      return NextResponse.json({ error: 'Gerentes só podem cadastrar funcionários.' }, { status: 403 });
    }

    const client = await clerkClient();
    const newUser = await client.users.createUser({
      emailAddress: [input.data.email],
      password: input.data.password,
      firstName: input.data.firstName,
      lastName: input.data.lastName,
      publicMetadata: { role: input.data.role },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.emailAddresses[0]?.emailAddress,
      role: input.data.role,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee', error);
    return NextResponse.json({ error: 'Erro ao criar funcionário.' }, { status: 500 });
  }
}
