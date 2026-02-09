// TEMPORARY SIMPLIFIED AUTH - Use this if JWT validation keeps failing
// This bypasses full JWT validation and trusts the token format
// DO NOT USE IN PRODUCTION - For development/debugging only

export const simpleAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Basic token format check
  if (token.length < 100) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Extract user ID from JWT payload (decode without verification - UNSAFE but works for debugging)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Malformed token' }, 401);
    }
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.sub) {
      return c.json({ error: 'Invalid token payload' }, 401);
    }
    
    // Set user context from decoded token
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email || 'unknown');
    
    console.log('⚠️ Simple auth: User', payload.email, 'authorized (WARNING: No signature verification!)');
    
    await next();
  } catch (error: any) {
    console.error('Simple auth failed:', error.message);
    return c.json({ error: 'Token decode failed' }, 401);
  }
};
