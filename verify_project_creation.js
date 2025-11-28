const API_URL = 'http://localhost:5001/api';

async function testProjectCreation() {
    try {
        const timestamp = Date.now();
        const email = `script_user_${timestamp}@test.com`;
        const password = 'password123';
        const username = `ScriptUser${timestamp}`;

        // 1. Register
        console.log(`Registering user ${email}...`);
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!registerRes.ok) {
            const errText = await registerRes.text();
            throw new Error(`Registration failed: ${registerRes.status} ${errText}`);
        }

        const registerData = await registerRes.json();
        const token = registerData.token;
        console.log('Registration successful. Token obtained.');

        // 2. Create Project
        console.log('Creating project...');
        const projectData = {
            title: 'Scripted Project',
            description: 'Created via verification script',
            category: 'Tech',
            status: 'Idea',
            lookingFor: 'Developers',
            memberLimit: 2
        };

        const createRes = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Project creation failed: ${createRes.status} ${errText}`);
        }

        const project = await createRes.json();

        const fs = await import('fs/promises');
        await fs.writeFile('verification_result.json', JSON.stringify(project, null, 2));
        console.log('Result written to verification_result.json');

        if (project.member_limit === 2) {
            console.log('SUCCESS: Member limit is correct.');
        } else {
            console.error('FAILURE: Member limit is incorrect:', project.member_limit);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testProjectCreation();
