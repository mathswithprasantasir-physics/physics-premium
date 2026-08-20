export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, packageName } = req.body;

        // টোকেন জেনারেট
        const token = generateToken(email, packageName);
        
        // ইমেইল পাঠান
        await sendAccessEmail(email, token, packageName);

        res.status(200).json({
            success: true,
            token: token,
            message: 'Access link sent to email'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}

function generateToken(email, packageName) {
    const encodedEmail = btoa(email);
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return 'prem_' + timestamp + '_' + encodedEmail + '_' + random;
}

async function sendAccessEmail(email, token, packageName) {
    const baseUrl = process.env.BASE_URL || 'https://physics-premium.vercel.app';
    const accessLink = `${baseUrl}/posts/2026/08/magnetic-effects.html?token=${token}`;
    
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_USER_ID,
            template_params: {
                to_email: email,
                access_link: accessLink,
                package_name: packageName || 'Premium Notes',
                expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
            }
        })
    });
}