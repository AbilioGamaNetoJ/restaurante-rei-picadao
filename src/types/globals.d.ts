export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'dono' | 'gerente' | 'funcionario';
    };
  }
}
