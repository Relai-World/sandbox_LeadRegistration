const supabase = require('../../superbase');

/**
 * Middleware to verify admin authentication
 * Expects x-user-email and x-user-id headers and validates admin role from database
 */
const verifyAdminAuth = async (req, res, next) => {
  try {
    // Get user credentials from headers
    const userEmail = req.headers['x-user-email'];
    const userId = req.headers['x-user-id'];
    
    if (!userEmail || !userId) {
      return res.status(401).json({ 
        message: 'Unauthorized: Admin authentication required',
        error: 'Missing authentication headers' 
      });
    }

    // Verify the user exists and has admin role
    const { data: user, error } = await supabase
      .from('UsersData')
      .select('id, email, role')
      .eq('id', userId)
      .eq('email', userEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error during admin auth:', error);
      return res.status(500).json({ 
        message: 'Internal server error during authentication',
        error: error.message 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid credentials',
        error: 'User not found' 
      });
    }

    const allowedAdminRoles = ['admin', 'BX'];
    if (!allowedAdminRoles.includes(user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Admin access required',
        error: 'Insufficient permissions - admin role required' 
      });
    }

    // Attach user info to request object for use in route handlers
    req.adminUser = user;
    console.log(`✅ Admin authenticated: ${user.email}`);
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication',
      error: error.message 
    });
  }
};

module.exports = {
  verifyAdminAuth
};
