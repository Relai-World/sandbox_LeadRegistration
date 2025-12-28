const bcrypt = require('bcryptjs');
const supabase = require('../../superbase');

const SignupUser = async (req, res) => {
    const { username, email, password, role = 'agent' } = req.body;
    try {
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`📝 Signup attempt for email: "${email}" -> normalized to: "${normalizedEmail}"`);

        const { data: existingUser, error: checkError } = await supabase
            .from('UsersData')
            .select('email')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (checkError) {
            console.error('🔥 Supabase query error during email check:', checkError);
            return res.status(500).json({ message: 'Database error during registration' });
        }

        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('UsersData')
            .insert([
                {
                    username,
                    email: normalizedEmail,
                    password: hashedPassword,
                    role
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('🔥 Supabase insert error:', insertError);
            return res.status(500).json({ message: 'Error creating user account' });
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("🔥 Unexpected error during signup:", error);
        res.status(500).json({ message: 'Server error during user registration' });
    }
};

const LoginUser = async (req, res) => {
    // Validate request body
    if (!req.body) {
        console.error('❌ Request body is missing');
        return res.status(400).json({ message: 'Request body is required' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        console.error('❌ Missing email or password in request');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Login attempt for:', email, '-> Normalized to:', normalizedEmail);

    // Check if Supabase is configured
    if (!supabase || supabase.isConfigured === false) {
        console.error('❌ Supabase is not configured');
        return res.status(503).json({
            message: 'Database not available. Please configure SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file.',
            error: 'Supabase not configured'
        });
    }

    if (typeof supabase.from !== 'function') {
        console.error('❌ Supabase client is not properly initialized');
        return res.status(500).json({
            message: 'Database client not initialized',
            error: 'Supabase client is not available'
        });
    }

    // Supabase login only
    try {
        console.log('🔍 Querying UsersData table for email:', email);
        const { data: user, error } = await supabase
            .from('UsersData')
            .select('id, username, email, password, role')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (error) {
            console.error('🔥 Supabase query error during login:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return res.status(500).json({
                message: 'Database error during login',
                error: error.message
            });
        }

        if (!user) {
            console.log('❌ User not found in database for email:', email);
            console.log('   Searched with normalized email:', email.toLowerCase().trim());
            return res.status(401).json({
                message: 'Invalid credentials',
                debug: 'User not found with this email address'
            });
        }

        console.log('✅ User found:', user.email, '| Username:', user.username, '| Role:', user.role);
        console.log('🔐 Password hash length:', user.password ? user.password.length : 0);
        console.log('🔐 Password hash prefix:', user.password ? user.password.substring(0, 20) + '...' : 'NULL');

        // Ensure there's a stored password before attempting compare
        if (!user.password) {
            console.warn('⚠️  User has no password hash stored:', email);
            return res.status(401).json({
                message: 'Invalid credentials',
                debug: 'User account has no password set'
            });
        }

        // Compare passwords
        console.log('🔑 Comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔑 Password match result:', isMatch);

        if (!isMatch) {
            console.log('❌ Password does not match for:', email);
            console.log('   Password provided length:', password ? password.length : 0);
            console.log('   Stored hash length:', user.password.length);
            return res.status(401).json({
                message: 'Invalid credentials',
                debug: 'Password does not match'
            });
        }

        console.log('✅ Login successful via Supabase for:', email);
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("❌ Unexpected error during login:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            message: 'Server error during login',
            error: error.message
        });
    }
};

const UpdatePassword = async (req, res) => {
    // Validate request body
    if (!req.body) {
        console.error('❌ Request body is missing');
        return res.status(400).json({ message: 'Request body is required' });
    }

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        console.error('❌ Missing email or newPassword in request');
        return res.status(400).json({ message: 'Email and newPassword are required' });
    }

    console.log('🔐 Password update attempt for:', email);

    // Check if Supabase is configured
    if (!supabase || supabase.isConfigured === false) {
        console.error('❌ Supabase is not configured');
        return res.status(503).json({
            message: 'Database not available. Please configure SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file.',
            error: 'Supabase not configured'
        });
    }

    if (typeof supabase.from !== 'function') {
        console.error('❌ Supabase client is not properly initialized');
        return res.status(500).json({
            message: 'Database client not initialized',
            error: 'Supabase client is not available'
        });
    }

    // Supabase password update only
    try {
        // Check if user exists
        const { data: user, error: checkError } = await supabase
            .from('UsersData')
            .select('id, email, username')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (checkError) {
            console.error('🔥 Supabase query error during password update:', checkError);
            return res.status(500).json({
                message: 'Database error during password update',
                error: checkError.message
            });
        }

        if (!user) {
            console.log('❌ User not found in database:', email);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('✅ User found:', user.email);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('🔐 Password hashed successfully');

        // Update the password
        const { error: updateError } = await supabase
            .from('UsersData')
            .update({ password: hashedPassword })
            .eq('email', email.toLowerCase().trim());

        if (updateError) {
            console.error('🔥 Supabase update error during password update:', updateError);
            return res.status(500).json({
                message: 'Database error during password update',
                error: updateError.message
            });
        }

        console.log('✅ Password updated successfully via Supabase for:', email);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("❌ Unexpected error during password update:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            message: 'Server error during password update',
            error: error.message
        });
    }
};

module.exports = {
    SignupUser,
    LoginUser,
    UpdatePassword
};